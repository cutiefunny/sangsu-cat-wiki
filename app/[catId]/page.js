"use client";

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, deleteDoc, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, storage } from '../../lib/firebase/clientApp';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import imageCompression from "browser-image-compression";
import styles from './catProfile.module.css';
import Thread from '../../components/Thread';
import CatProfileSkeleton from '../../components/CatProfileSkeleton'; // 스켈레톤 컴포넌트 import

// Swiper 관련 import 추가
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard } from 'swiper/modules';

// Swiper 기본 스타일 import
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// 날짜 포맷 함수 추가
const formatDate = (date) => {
  const pad = (num) => num.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

export default function CatProfile({ params }) {
  const [cat, setCat] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const router = useRouter();
  const resolvedParams = use(params);
  const { catId } = resolvedParams;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const fetchCatData = async () => {
    if (!catId) return;
    setLoading(true);
    try {
      const catDocRef = doc(db, 'cats', catId);
      const catDocSnap = await getDoc(catDocRef);

      if (catDocSnap.exists()) {
        const catData = { id: catDocSnap.id, ...catDocSnap.data() };
        setCat(catData);
        setEditedName(catData.name);
        setEditedDescription(catData.description || '');

        const photosQuery = query(
          collection(db, 'photos'),
          where('catId', '==', catId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(photosQuery);
        setPhotos(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        console.log('No such cat!');
        setCat(null);
      }
    } catch (error) {
      console.error("Error fetching cat data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatData();
  }, [catId]);

  const handleUpdateCat = async () => {
    if (!catId || !editedName.trim()) {
        alert('고양이 이름은 비워둘 수 없습니다.');
        return;
    }
    try {
        const catDocRef = doc(db, 'cats', catId);
        await updateDoc(catDocRef, {
            name: editedName,
            description: editedDescription,
        });

        // catName이 변경되었다면 관련된 사진들의 catName도 업데이트
        if (cat.name !== editedName) {
            const batch = writeBatch(db);
            const photosQuery = query(collection(db, "photos"), where("catId", "==", catId));
            const photosSnapshot = await getDocs(photosQuery);
            photosSnapshot.forEach((photoDoc) => {
                batch.update(photoDoc.ref, { catName: editedName });
            });
            await batch.commit();
        }

        alert('도감 정보가 수정되었습니다.');
        setIsEditing(false);
        fetchCatData(); // 최신 정보 다시 불러오기
    } catch (error) {
        console.error("Error updating cat:", error);
        alert('정보 수정에 실패했습니다.');
    }
  };

  const handleDeleteCat = async () => {
    if (!catId || !confirm(`'${cat.name}' 도감을 정말로 삭제하시겠습니까?\n관련된 모든 사진과 타임라인 기록이 영구적으로 삭제됩니다.`)) return;

    try {
        const batch = writeBatch(db);

        // 1. 관련된 모든 사진 삭제 (Firestore)
        const photosQuery = query(collection(db, 'photos'), where('catId', '==', catId));
        const photosSnapshot = await getDocs(photosQuery);
        photosSnapshot.forEach(doc => {
            // Storage에서 이미지 파일 삭제
            const photoData = doc.data();
            if (photoData.imageUrl) {
                const imageRef = ref(storage, photoData.imageUrl);
                deleteObject(imageRef).catch(err => console.error("Error deleting image from storage:", err));
            }
            batch.delete(doc.ref);
        });

        // 2. 관련된 모든 타임라인(스레드) 삭제
        const threadsQuery = query(collection(db, 'threads'), where('catId', '==', catId));
        const threadsSnapshot = await getDocs(threadsQuery);
        threadsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 3. 고양이 도감 문서 삭제
        const catDocRef = doc(db, 'cats', catId);
        batch.delete(catDocRef);

        // 4. 일괄 작업 실행
        await batch.commit();

        alert('도감이 삭제되었습니다.');
        router.push('/'); // 홈페이지로 이동
    } catch (error) {
        console.error("Error deleting cat and related data:", error);
        alert('도감 삭제에 실패했습니다.');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !cat) return;

    setIsUploading(true);
    try {
      const options = { maxSizeMB: 0.1, maxWidthOrHeight: 600, useWebWorker: true, fileType: "image/avif" };
      const compressedFile = await imageCompression(file, options);
      
      const timestamp = formatDate(new Date());
      const newFileName = `${timestamp}.avif`;
      const storageRef = ref(storage, `images/${newFileName}`);
      
      const metadata = { contentType: 'image/avif' };
      const snapshot = await uploadBytes(storageRef, compressedFile, metadata);
      const url = await getDownloadURL(snapshot.ref);

      // Firestore에 사진 정보 추가
      await addDoc(collection(db, "photos"), {
        imageUrl: url,
        lat: photos.length > 0 ? photos[0].lat : 0, // 첫번째 사진의 위치 사용 또는 기본값
        lng: photos.length > 0 ? photos[0].lng : 0,
        createdAt: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName,
        userPhotoURL: user.photoURL,
        catId: cat.id,
        catName: cat.name,
      });

      alert("사진이 도감에 추가되었습니다.");
      fetchCatData(); // 사진 목록 새로고침

    } catch (error) {
      console.error("Upload failed:", error);
      alert("업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
      // 입력값 초기화
      e.target.value = null;
    }
  };


  const canEdit = user && (user.email === 'cutiefunny@gmail.com' || user.uid === cat?.createdBy);

  if (loading) return <CatProfileSkeleton />;
  if (!cat) return <div className={styles.message}>존재하지 않는 고양이입니다.</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        {isEditing ? (
          <div className={styles.editForm}>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className={styles.nameInput}
            />
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className={styles.descriptionInput}
              rows="3"
            />
          </div>
        ) : (
          <>
            <h1 className={styles.name}>{cat.name}</h1>
            {cat.description && <p className={styles.description}>{cat.description}</p>}
          </>
        )}
        
        {canEdit && (
          <div className={styles.buttonGroup}>
            {isEditing ? (
              <>
                <button onClick={handleUpdateCat} className={styles.saveButton}>저장</button>
                <button onClick={() => setIsEditing(false)} className={styles.cancelButton}>취소</button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className={styles.editButton}>수정</button>
                <button onClick={handleDeleteCat} className={styles.deleteButton}>삭제</button>
              </>
            )}
          </div>
        )}
      </header>
      
      <main>
        
        {photos.length > 0 ? (
          <div className={styles.sliderContainer}>
            <Swiper
              modules={[Navigation, Pagination, Keyboard]}
              spaceBetween={20}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              keyboard={{ enabled: true }}
              loop={true}
            >
              {photos.map(photo => (
                <SwiperSlide key={photo.id}>
                  <img src={photo.imageUrl} alt={`${cat.name} 사진`} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : (
          <p className={styles.message}>아직 등록된 사진이 없습니다.</p>
        )}
        
        {/* Thread 컴포넌트 추가 및 cat 객체 전달 */}
        <Thread cat={cat} isAdmin={user && user.email === 'cutiefunny@gmail.com'} onPostCreated={fetchCatData} />
      </main>
    </div>
  );
}