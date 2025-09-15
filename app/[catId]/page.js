// app/[catId]/page.js
"use client";

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase/clientApp';
import styles from './catProfile.module.css'; // 프로필 페이지용 CSS 모듈

// URL 파라미터(catId)를 props로 받아옵니다.
export default function CatProfile({ params }) {
  const [cat, setCat] = useState(null);
  const [photos, setPhotos] = useState([]);
  const { catId } = params;

  useEffect(() => {
    if (!catId) return;

    // 고양이 정보 가져오기
    const fetchCatProfile = async () => {
      const catDocRef = doc(db, 'cats', catId);
      const catDocSnap = await getDoc(catDocRef);
      if (catDocSnap.exists()) {
        setCat(catDocSnap.data());
      } else {
        console.log('No such cat!');
      }
    };

    // 해당 고양이의 모든 사진 가져오기
    const fetchCatPhotos = async () => {
      const photosQuery = query(collection(db, 'photos'), where('catId', '==', catId));
      const querySnapshot = await getDocs(photosQuery);
      const photosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPhotos(photosData);
    };

    fetchCatProfile();
    fetchCatPhotos();
  }, [catId]);

  if (!cat) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.name}>{cat.name}</h1>
      <p className={styles.description}>{cat.description}</p>
      
      <div className={styles.gallery}>
        {photos.map(photo => (
          <img key={photo.id} src={photo.imageUrl} alt={`${cat.name} 사진`} className={styles.photo} />
        ))}
      </div>
    </div>
  );
}