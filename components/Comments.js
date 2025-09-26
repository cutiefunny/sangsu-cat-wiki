import { useState, useEffect } from 'react';
import Image from 'next/image'; // Image import
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase/clientApp';
import styles from './Comments.module.css';

function Comments({ photo, isAdmin, onLoginRequest }) {
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
    if (!photo?.id) return;
    const q = query(collection(db, 'comments'), where('photoId', '==', photo.id));
    const querySnapshot = await getDocs(q);
    const commentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    commentsData.sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
    setComments(commentsData);
  };

  useEffect(() => {
    fetchComments();
  }, [photo.id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      onLoginRequest();
      return;
    }
    if (!newComment.trim()) {
      return;
    }

    try {
      await addDoc(collection(db, 'comments'), {
        photoId: photo.id,
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
      <div className={styles.commentsList}>
        {comments.map(comment => (
          <div key={comment.id} className={styles.comment}>
            <Image
              src={comment.userPhotoURL}
              alt={comment.userName}
              className={styles.commentUserPhoto}
              width={30}
              height={30}
            />
            <div className={styles.commentBody}>
              <strong>
                {comment.userName}
                {photo.userId === comment.userId && <span className={styles.authorTag}> (작성자)</span>}
              </strong>
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
      <form onSubmit={handleAddComment} className={styles.commentForm}>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className={styles.commentInput}
        />
        <button type="submit" className={styles.commentSubmitBtn}>
          <Image src="/images/confirm.png" alt="등록" width={40} height={30} />
        </button>
      </form>
    </div>
  );
}

export default Comments;