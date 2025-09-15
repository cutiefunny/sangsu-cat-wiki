import React from "react";
import styles from "./Modal.module.css";
import Comments from "./Comments";

// onLoginRequest prop을 받도록 수정
function Modal({ photo, onClose, isAdmin, onDelete, onLoginRequest }) {
  if (!photo) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <div className={styles.imageContainer}>
          <img src={photo.imageUrl} alt="상세 이미지" className={styles.modalImage} />
          {isAdmin && (
            <button
              className={styles.deleteButton}
              onClick={() => onDelete(photo.id, photo.imageUrl)}
            >
              삭제
            </button>
          )}
        </div>
        {/* Comments 컴포넌트로 onLoginRequest prop 전달 */}
        <Comments photoId={photo.id} isAdmin={isAdmin} onLoginRequest={onLoginRequest} />
      </div>
    </div>
  );
}

export default Modal;