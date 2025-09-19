import React from "react";
import Link from 'next/link';
import styles from "./Modal.module.css";
import Comments from "./Comments";

function Modal({ photo, onClose, isAdmin, onDelete, onLoginRequest, onCreateCatProfile, user }) {
  if (!photo) return null;

  // 현재 로그인한 사용자가 사진을 업로드한 사용자인지 확인
  const isOwner = user && user.uid === photo.userId;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <div className={styles.imageContainer}>
          <img src={photo.imageUrl} alt="상세 이미지" className={styles.modalImage} />

          {/* '도감 만들기' 또는 '도감 보기' 버튼 */}
          {photo.catId ? (
            <Link 
              href={`/${photo.catId}`} 
              className={`${styles.actionButton} ${styles.viewAlbumButton}`}
            >
              도감 보기
            </Link>
          ) : (
            // 사진 주인이면서 아직 도감이 없을 때만 '도감 만들기' 버튼 표시
            isOwner && (
              <button
                className={`${styles.actionButton} ${styles.createAlbumButton}`}
                onClick={() => onCreateCatProfile(photo)}
              >
                도감 만들기
              </button>
            )
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