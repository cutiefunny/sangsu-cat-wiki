// app/[catId]/page.js
"use client";

// React의 'use' hook을 import 합니다.
import { useEffect, useState, use } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/clientApp';
import styles from './catProfile.module.css';

// URL 파라미터(catId)를 props로 받아옵니다.
export default function CatProfile({ params }) {
  const [cat, setCat] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // React.use()를 사용하여 params Promise를 해결합니다.
  const resolvedParams = use(params);
  const { catId } = resolvedParams;

  useEffect(() => {
    if (!catId) return;

    const fetchCatData = async () => {
      setLoading(true);
      try {
        // 고양이 정보 가져오기
        const catDocRef = doc(db, 'cats', catId);
        const catDocSnap = await getDoc(catDocRef);
        if (catDocSnap.exists()) {
          setCat({ id: catDocSnap.id, ...catDocSnap.data() });
        } else {
          console.log('No such cat!');
          setCat(null);
        }

        // 해당 고양이의 모든 사진 가져오기 (최신순으로 정렬)
        const photosQuery = query(
          collection(db, 'photos'), 
          where('catId', '==', catId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(photosQuery);
        const photosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPhotos(photosData);

      } catch (error) {
        console.error("Error fetching cat data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCatData();
  }, [catId]);

  if (loading) {
    return <div className={styles.message}>로딩 중...</div>;
  }

  if (!cat) {
    return <div className={styles.message}>존재하지 않는 고양이입니다.</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.name}>{cat.name}</h1>
        {cat.description && <p className={styles.description}>{cat.description}</p>}
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