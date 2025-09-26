import React from 'react';
import Image from 'next/image'; // Image import
import styles from './PhotoGallery.module.css';

function PhotoGallery({ photos, onPhotoClick }) {
  if (!photos || photos.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.placeholder}>현재 지도 영역에 사진이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {photos.map((photo) => (
        <div key={photo.id} className={styles.photoWrapper} onClick={() => onPhotoClick(photo)}>
          <Image 
            src={photo.imageUrl} 
            alt="Gallery thumbnail" 
            className={styles.photo}
            width={100}
            height={100}
          />
        </div>
      ))}
    </div>
  );
}

export default PhotoGallery;