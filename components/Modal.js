// components/Modal.js

import React from "react";
import Link from 'next/link';
import styles from "./Modal.module.css";
import Comments from "./Comments";

function Modal({ photo, onClose, isAdmin, onDelete, onLoginRequest, onCreateCatProfile }) {
  if (!photo) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <div className={styles.imageContainer}>
          <img src={photo.imageUrl} alt="상세 이미지" className={styles.modalImage} />

          {/* '도감 만들기' 또는 '도감 보기' 버튼 (legacyBehavior 수정) */}
          {photo.catId ? (
            <Link 
              href={`/${photo.catId}`} 
              className={`${styles.actionButton} ${styles.viewAlbumButton}`}
            >
              도감 보기
            </Link>
          ) : (
            <button
              className={`${styles.actionButton} ${styles.createAlbumButton}`}
              onClick={() => onCreateCatProfile(photo)}
            >
              도감 만들기
            </button>
          )}

          {isAdmin && (
            <button
              className={styles.deleteButton}
              onClick={() => onDelete(photo.id, photo.imageUrl)}
            >
              삭제
            </button>
          )}
        </div>

        <Comments photo={photo} isAdmin={isAdmin} onLoginRequest={onLoginRequest} />
      </div>
    </div>
  );
}

export default Modal;