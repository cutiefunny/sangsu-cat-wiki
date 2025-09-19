import React from 'react';
import Skeleton from './Skeleton';
import styles from './CatProfileSkeleton.module.css';
import catProfileStyles from '../app/[catId]/catProfile.module.css';
import threadStyles from './Thread.module.css';

const CatProfileSkeleton = () => {
  return (
    <div className={catProfileStyles.container}>
      <header className={`${catProfileStyles.header} ${styles.header}`}>
        <Skeleton style={{ width: '60%', height: '40px', margin: '0 auto 10px' }} />
        <Skeleton style={{ width: '80%', height: '20px', margin: '0 auto' }} />
      </header>
      <main>
        <div className={catProfileStyles.sliderContainer}>
          <Skeleton style={{ width: '100%', height: '100%' }} />
        </div>
        <div className={threadStyles.threadSection}>
          <div className={threadStyles.threadForm}>
            <Skeleton style={{ width: '100%', height: '80px', marginBottom: '10px' }} />
            <div className={threadStyles.formActions}>
              <Skeleton style={{ width: '80px', height: '36px' }} />
              <Skeleton style={{ width: '60px', height: '36px' }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CatProfileSkeleton;