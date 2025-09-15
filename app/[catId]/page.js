"use client";

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, deleteDoc, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, storage } from '../../lib/firebase/clientApp';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import styles from './catProfile.module.css';
import Thread from '../../components/Thread'; // Thread 컴포넌트 import

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
    // ... (기존 코드와 동일)
  };

  const handleDeleteCat = async () => {
    // ... (기존 코드와 동일)
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

  if (loading) return <div className={styles.message}>로딩 중...</div>;
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
        <div className={styles.galleryHeader}>
          <h3>사진첩</h3>
        </div>
        <div className={styles.gallery}>
          {photos.length > 0 ? (
            photos.map(photo => (
              <div key={photo.id} className={styles.photoContainer}>
                <img src={photo.imageUrl} alt={`${cat.name} 사진`} className={styles.photo} />
              </div>
            ))
          ) : (
            <p className={styles.message}>아직 등록된 사진이 없습니다.</p>
          )}
        </div>
        
        {/* Thread 컴포넌트 추가 */}
        <Thread catId={catId} isAdmin={user && user.email === 'cutiefunny@gmail.com'} />
      </main>
    </div>
  );
}