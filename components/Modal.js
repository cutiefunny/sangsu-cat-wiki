import React from "react";
import Link from 'next/link';
import Image from 'next/image'; // Image import
import styles from "./Modal.module.css";
import Comments from "./Comments";

function Modal({ photo, onClose, isAdmin, onDelete, onLoginRequest, onCreateCatProfile, user }) {
  if (!photo) return null;

  const isOwner = user && user.uid === photo.userId;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <div className={styles.imageContainer}>
          <Image 
            src={photo.imageUrl} 
            alt="상세 이미지" 
            className={styles.modalImage} 
            width={500} // 예시 크기, 실제 비율에 맞게 조정 필요
            height={500}
            style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
            priority // 모달 이미지는 중요하므로 우선 로드
          />

          {photo.catId ? (
            <Link 
              href={`/${photo.catId}`} 
              className={`${styles.actionButton} ${styles.viewAlbumButton}`}
            >
              도감 보기
            </Link>
          ) : (
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