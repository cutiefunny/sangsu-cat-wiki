import React from 'react';
import Skeleton from './Skeleton';
import gridStyles from '../app/activity/activity.module.css';

const PhotoCardSkeleton = () => {
  return (
    <div className={gridStyles.photoGrid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className={gridStyles.photoCard}>
          <Skeleton style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
        </div>
      ))}
    </div>
  );
};

export default PhotoCardSkeleton;