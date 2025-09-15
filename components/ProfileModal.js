import React from 'react';
import styles from './ProfileModal.module.css';
import { auth } from '../lib/firebase/clientApp';
import { signOut } from 'firebase/auth';

function ProfileModal({ user, onClose }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose(); // 로그아웃 후 모달 닫기
    } catch (error) {
      console.error("Logout failed:", error);
      alert('로그아웃에 실패했습니다.');
    }
  };

  if (!user) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.profileSection}>
          <img src={user.photoURL} alt="프로필 사진" className={styles.profileImage} />
          <span className={styles.displayName}>{user.displayName}</span>
        </div>
        <ul className={styles.menuList}>
          <li className={styles.menuItem}>아바타 변경</li>
          <li className={styles.menuItem}>닉네임 변경</li>
          <li className={styles.menuItem}>내 활동 내역</li>
          <li className={styles.menuItem} onClick={handleLogout}>로그아웃</li>
        </ul>
      </div>
    </div>
  );
}

export default ProfileModal;