import React from "react";
import styles from "./Modal.module.css";
import Comments from "./Comments";

// photo 객체를 Comments 컴포넌트에 전달하도록 수정합니다.
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
        {/* photoId 대신 photo 객체 전체를 전달합니다. */}
        <Comments photo={photo} isAdmin={isAdmin} onLoginRequest={onLoginRequest} />
      </div>
    </div>
  );
}

export default Modal;