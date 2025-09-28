import React from 'react';
// Image 컴포넌트는 더 이상 이 파일에서 필요하지 않을 수 있으나, 다른 이미지가 추가될 수 있으니 유지합니다.
import Image from 'next/image'; 
import styles from './InstallPWA_Modal.module.css';

function InstallPWA_Modal({ os, onClose, onInstall }) {
  // --- iOS 공유 아이콘 SVG ---
  const IosShareIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.shareIcon}
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <h2 className={styles.title}>앱을 설치하시겠습니까?</h2>
        <Image src="/images/safe.jpg" alt="안심" width={100} height={100} className={styles.image} />
        <p className={styles.description}>
          근육고양이잡화점의 이름을 걸고<br></br>이 앱은 무해합니다.
        </p>
        
        {os === 'android' ? (
          <div className={styles.buttonContainer}>
            <button onClick={onInstall} className={styles.installButton}>
              앱 설치
            </button>
          </div>
        ) : (
          <div className={styles.iosGuide}>
            <p>1. 하단 메뉴의 <IosShareIcon /> 공유 버튼을 누릅니다.</p>
            <p>2. '홈 화면에 추가'를 선택하여 설치를 완료하세요.</p>
            <div className={styles.buttonContainer}>
                <button onClick={onClose} className={styles.installButton}>
                    알겠습니다
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InstallPWA_Modal;