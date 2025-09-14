import React from "react";
import styles from "./Modal.module.css";

function Modal({ photo, onClose, isAdmin, onDelete }) {
  if (!photo) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <img src={photo.imageUrl} alt="상세 이미지" />
        {/* isAdmin이 true일 때만 삭제 버튼을 렌더링합니다. */}
        {isAdmin && (
          <button
            className={styles.deleteButton}
            onClick={() => onDelete(photo.id, photo.imageUrl)}
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}

export default Modal;