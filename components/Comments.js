import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase/clientApp';
import styles from './Comments.module.css';

// onLoginRequest prop 추가
function Comments({ photoId, isAdmin, onLoginRequest }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchComments = async () => {
    if (!photoId) return;
    const q = query(collection(db, 'comments'), where('photoId', '==', photoId));
    const querySnapshot = await getDocs(q);
    const commentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    commentsData.sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
    setComments(commentsData);
  };

  useEffect(() => {
    fetchComments();
  }, [photoId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    // 사용자가 없으면 로그인 요청 함수를 호출
    if (!user) {
      onLoginRequest();
      return;
    }
    if (!newComment.trim()) {
      return; // 댓글 내용이 없으면 아무것도 안 함
    }

    try {
      await addDoc(collection(db, 'comments'), {
        photoId,
        userId: user.uid,
        userName: user.displayName,
        userPhotoURL: user.photoURL,
        text: newComment,
        createdAt: serverTimestamp(),
      });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error("Error adding comment: ", error);
      alert('댓글 작성에 실패했습니다.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, "comments", commentId));
        fetchComments();
      } catch (error) {
        console.error("Error deleting comment: ", error);
        alert('댓글 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div className={styles.commentsSection}>
      {/* h3 제목 태그 제거 */}
      <div className={styles.commentsList}>
        {comments.map(comment => (
          <div key={comment.id} className={styles.comment}>
            <img src={comment.userPhotoURL} alt={comment.userName} className={styles.commentUserPhoto} />
            <div className={styles.commentBody}>
              <strong>{comment.userName}</strong>
              <p>{comment.text}</p>
            </div>
            {(isAdmin || (user && user.uid === comment.userId)) && (
              <button
                className={styles.deleteCommentBtn}
                onClick={() => handleDeleteComment(comment.id)}
                title="댓글 삭제"
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>
      {/* 로그인 여부와 관계없이 항상 form을 표시 */}
      <form onSubmit={handleAddComment} className={styles.commentForm}>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className={styles.commentInput}
        />
        <button type="submit" className={styles.commentSubmitBtn}>등록</button>
      </form>
    </div>
  );
}

export default Comments;