import React from 'react';
import RecentPhotoCard from './RecentPhotoCard';
import styles from './RecentPhotos.module.css'; // css 파일 이름 확인

const RecentPhotos = ({ photos, isLoading, onPhotoClick }) => { // onPhotoClick prop 추가
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>최근 올라온 사진</h2>
      {isLoading ? (
        <p className={styles.loadingText}>최근 사진을 불러오는 중...</p>
      ) : (
        <div className={styles.grid}>
          {photos.length > 0 ? (
            photos.map(photo => (
              // 각 카드에 클릭 핸들러를 넘겨줍니다.
              <div key={photo.id} onClick={() => onPhotoClick(photo)}>
                <RecentPhotoCard photo={photo} />
              </div>
            ))
          ) : (
            <p className={styles.noCatsMessage}>24시간 이내에 등록된 사진이 없습니다.</p>
          )}
        </div>
      )}
    </section>
  );
};

export default RecentPhotos;