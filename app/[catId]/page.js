// app/[catId]/page.js
"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation'; // useRouter import
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase/clientApp'; // auth import
import { onAuthStateChanged } from 'firebase/auth'; // onAuthStateChanged import
import styles from './catProfile.module.css';

export default function CatProfile({ params }) {
  const [cat, setCat] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  const router = useRouter();
  const resolvedParams = use(params);
  const { catId } = resolvedParams;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!catId) return;

    const fetchCatData = async () => {
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

    fetchCatData();
  }, [catId]);

  const handleUpdateCat = async () => {
    if (!cat) return;
    const catDocRef = doc(db, 'cats', catId);
    try {
      await updateDoc(catDocRef, {
        name: editedName,
        description: editedDescription,
      });
      // photos 컬렉션의 catName도 업데이트
      const batch = writeBatch(db);
      const photosQuery = query(collection(db, "photos"), where("catId", "==", catId));
      const photosSnapshot = await getDocs(photosQuery);
      photosSnapshot.forEach((photoDoc) => {
        batch.update(doc(db, "photos", photoDoc.id), { catName: editedName });
      });
      await batch.commit();

      setCat({ ...cat, name: editedName, description: editedDescription });
      setIsEditing(false);
      alert('정보가 수정되었습니다.');
    } catch (error) {
      console.error("Error updating cat data:", error);
      alert('수정에 실패했습니다.');
    }
  };

  const handleDeleteCat = async () => {
    if (!cat) return;
    if (confirm(`'${cat.name}' 도감을 정말 삭제하시겠습니까? 연결된 모든 사진에서 고양이 정보가 사라집니다.`)) {
      try {
        // 1. 'cats' 문서 삭제
        await deleteDoc(doc(db, 'cats', catId));
        
        // 2. 이 고양이와 연결된 모든 'photos' 문서에서 catId와 catName 필드 제거
        const batch = writeBatch(db);
        const photosQuery = query(collection(db, "photos"), where("catId", "==", catId));
        const photosSnapshot = await getDocs(photosQuery);
        photosSnapshot.forEach((photoDoc) => {
          batch.update(doc(db, "photos", photoDoc.id), {
            catId: '',
            catName: ''
          });
        });
        await batch.commit();

        alert('도감이 삭제되었습니다.');
        router.push('/'); // 홈페이지로 리디렉션
      } catch (error) {
        console.error("Error deleting cat data:", error);
        alert('삭제에 실패했습니다.');
      }
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
      
      <main className={styles.gallery}>
        {photos.length > 0 ? (
          photos.map(photo => (
            <div key={photo.id} className={styles.photoContainer}>
              <img src={photo.imageUrl} alt={`${cat.name} 사진`} className={styles.photo} />
            </div>
          ))
        ) : (
          <p className={styles.message}>아직 등록된 사진이 없습니다.</p>
        )}
      </main>
    </div>
  );
}