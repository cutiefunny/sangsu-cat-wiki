// components/Thread.js
import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db, auth, storage } from '../lib/firebase/clientApp';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import imageCompression from "browser-image-compression";
import styles from './Thread.module.css';

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

function Thread({ cat, isAdmin, onPostCreated }) {
  const [threads, setThreads] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchThreads = async () => {
    if (!cat?.id) return;
    const q = query(
      collection(db, 'threads'),
      where('catId', '==', cat.id),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const threadsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setThreads(threadsData);
  };

  useEffect(() => {
    if (cat?.id) {
        fetchThreads();
    }
  }, [cat?.id]);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!newPost.trim() && !imageFile) return;

    // cat 객체가 유효한지 확인
    if (!cat || !cat.id) {
        alert('고양이 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
    }

    setIsLoading(true);
    let imageUrl = '';

    try {
      // 1. 이미지가 있으면 업로드
      if (imageFile) {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true, fileType: "image/avif" };
        const compressedFile = await imageCompression(imageFile, options);
        
        const timestamp = formatDate(new Date());
        const newFileName = `${timestamp}.avif`;
        const storageRef = ref(storage, `images/${newFileName}`);
        
        const snapshot = await uploadBytes(storageRef, compressedFile, { contentType: 'image/avif' });
        imageUrl = await getDownloadURL(snapshot.ref);

        // 2. 'photos' 컬렉션에도 사진 정보 추가 (갤러리용)
        await addDoc(collection(db, "photos"), {
            imageUrl: imageUrl,
            lat: cat.lat || 0, // 도감의 대표 위치 정보 사용
            lng: cat.lng || 0,
            createdAt: serverTimestamp(),
            userId: user.uid,
            userName: user.displayName,
            userPhotoURL: user.photoURL,
            catId: cat.id,
            catName: cat.name,
          });
      }

      // 3. 'threads' 컬렉션에 글과 이미지 URL 추가
      await addDoc(collection(db, 'threads'), {
        catId: cat.id,
        userId: user.uid,
        userName: user.displayName,
        userPhotoURL: user.photoURL,
        text: newPost,
        imageUrl: imageUrl, // 이미지 URL 추가
        createdAt: serverTimestamp(),
      });
      
      // 폼 초기화
      setNewPost('');
      setImageFile(null);
      setImagePreview('');
      if(fileInputRef.current) {
        fileInputRef.current.value = null;
      }

      // 부모 컴포넌트에 데이터 새로고침 요청
      if (onPostCreated) {
        onPostCreated();
      }
      fetchThreads(); // 현재 컴포넌트의 스레드 목록도 바로 갱신

    } catch (error) {
      console.error("Error adding post: ", error);
      alert('글 작성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (post) => {
    if (confirm("정말로 이 글을 삭제하시겠습니까?")) {
        try {
            // 이미지가 있는 게시물인 경우, Storage와 'photos' 컬렉션에서도 삭제
            if (post.imageUrl) {
                const batch = writeBatch(db);

                // 1. 'photos' 컬렉션에서 해당 이미지 URL을 가진 문서 찾아 삭제 목록에 추가
                const photosQuery = query(collection(db, 'photos'), where('imageUrl', '==', post.imageUrl));
                const photosSnapshot = await getDocs(photosQuery);
                if (!photosSnapshot.empty) {
                    photosSnapshot.forEach(photoDoc => {
                        batch.delete(photoDoc.ref);
                    });
                }

                // 2. 'threads' 문서 삭제 목록에 추가
                batch.delete(doc(db, "threads", post.id));

                // 3. Firestore 일괄 작업 실행
                await batch.commit();

                // 4. Storage에서 이미지 파일 삭제
                const imageRef = ref(storage, post.imageUrl);
                await deleteObject(imageRef);

            } else {
                // 이미지가 없는 경우, 'threads' 문서만 삭제
                await deleteDoc(doc(db, "threads", post.id));
            }

            // 목록 새로고침
            fetchThreads();
            if (onPostCreated) { // 부모 컴포넌트(도감 페이지)의 데이터 갱신
              onPostCreated();
            }

        } catch (error) {
            console.error("Error deleting post: ", error);
            alert('삭제에 실패했습니다.');
        }
    }
  };

  return (
    <div className={styles.threadSection}>
      {user && (
        <form onSubmit={handleAddPost} className={styles.threadForm}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="고양이에 대한 소식을 남겨주세요."
            className={styles.threadInput}
            maxLength="100"
          />
          {imagePreview && (
            <div className={styles.imagePreviewContainer}>
              <img src={imagePreview} alt="미리보기" className={styles.imagePreview}/>
              <button type="button" onClick={() => {setImageFile(null); setImagePreview(''); if(fileInputRef.current) fileInputRef.current.value=null;}} className={styles.imagePreviewRemoveBtn}>&times;</button>
            </div>
          )}
          <div className={styles.formActions}>
            <button type="button" onClick={() => fileInputRef.current.click()} className={styles.addPhotoButton}>
              사진 추가
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button type="submit" className={styles.threadSubmitBtn} disabled={isLoading}>
              {isLoading ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      )}
      <div className={styles.threadList}>
        {threads.map(post => (
          <div key={post.id} className={styles.threadItem}>
            <img src={post.userPhotoURL} alt={post.userName} className={styles.threadUserPhoto} />
            <div className={styles.threadBody}>
              <strong>{post.userName}</strong>
              {post.text && <p>{post.text}</p>}
              {post.imageUrl && <img src={post.imageUrl} alt="스레드 이미지" className={styles.threadImage} />}
              <span className={styles.threadDate}>
                {post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString() : ''}
              </span>
            </div>
            {(isAdmin || (user && user.uid === post.userId)) && (
              <button
                className={styles.deleteThreadBtn}
                onClick={() => handleDeletePost(post)}
                title="글 삭제"
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Thread;