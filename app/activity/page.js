"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase/clientApp';
import { onAuthStateChanged } from 'firebase/auth';
import styles from './activity.module.css';
import Link from 'next/link';
import PhotoCardSkeleton from '../../components/PhotoCardSkeleton'; // 스켈레톤 컴포넌트 import

export default function ActivityPage() {
  const [user, setUser] = useState(null);
  const [myPhotos, setMyPhotos] = useState([]);
  const [myComments, setMyComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchActivities(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchActivities = async (uid) => {
    setLoading(true);
    try {
      // 내가 올린 사진 가져오기
      const photosQuery = query(
        collection(db, 'photos'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const photosSnapshot = await getDocs(photosQuery);
      setMyPhotos(photosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // 내가 쓴 댓글 가져오기 (photoId를 포함하여 어떤 사진에 댓글을 달았는지 알 수 있도록)
      const commentsQuery = query(
        collection(db, 'comments'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      
      // 각 댓글에 해당하는 사진 정보를 함께 가져오기
      const commentsData = await Promise.all(commentsSnapshot.docs.map(async (doc) => {
        const comment = { id: doc.id, ...doc.data() };
        // 댓글에 photoId가 있다면 사진 정보를 가져옵니다.
        if (comment.photoId) {
            const photoQuery = query(collection(db, 'photos'), where('__name__', '==', comment.photoId));
            const photoSnap = await getDocs(photoQuery);
            if (!photoSnap.empty) {
                comment.photo = photoSnap.docs[0].data();
            }
        }
        return comment;
      }));
      setMyComments(commentsData);

    } catch (error) {
      console.error("Error fetching activities:", error);
      alert('활동 내역을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>내 활동 내역</h1>
          <Link href="/" className={styles.homeLink}>홈으로 돌아가기</Link>
        </header>
        <section>
          <h2>내가 올린 사진 (...)</h2>
          <PhotoCardSkeleton />
        </section>
        <section>
          <h2>내가 쓴 댓글 (...)</h2>
          {/* 댓글 스켈레톤 UI도 필요하다면 추가할 수 있습니다. */}
          <p className={styles.message}>로딩 중...</p>
        </section>
      </div>
    );
  }

  if (!user) {
    return <div className={styles.message}>로그인이 필요합니다. <Link href="/">홈으로</Link></div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>내 활동 내역</h1>
        <Link href="/" className={styles.homeLink}>홈으로 돌아가기</Link>
      </header>

      <section>
        <h2>내가 올린 사진 ({myPhotos.length}개)</h2>
        {myPhotos.length > 0 ? (
          <div className={styles.photoGrid}>
            {myPhotos.map(photo => (
              <div key={photo.id} className={styles.photoCard}>
                <img src={photo.imageUrl} alt="내가 올린 고양이 사진" />
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.message}>아직 올린 사진이 없습니다.</p>
        )}
      </section>

      <section>
        <h2>내가 쓴 댓글 ({myComments.length}개)</h2>
        {myComments.length > 0 ? (
          <ul className={styles.commentList}>
            {myComments.map(comment => (
              <li key={comment.id} className={styles.commentItem}>
                {comment.photo && (
                  <img src={comment.photo.imageUrl} alt="댓글 단 사진" className={styles.commentPhotoThumbnail} />
                )}
                <div className={styles.commentContent}>
                  <p>"{comment.text}"</p>
                  <span className={styles.commentDate}>
                    {new Date(comment.createdAt?.toDate()).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.message}>아직 작성한 댓글이 없습니다.</p>
        )}
      </section>
    </div>
  );
}