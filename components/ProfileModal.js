import React, { useState, useRef } from 'react';
import Image from 'next/image'; // Image import
import styles from './ProfileModal.module.css';
import { auth } from '../lib/firebase/clientApp';
import { signOut } from 'firebase/auth';
import Link from 'next/link';

function ProfileModal({ user, onClose, onUpdateAvatar, onUpdateNickname }) {
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState(user.displayName);
  const [isLoading, setIsLoading] = useState(false);
  const avatarInputRef = useRef(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error("Logout failed:", error);
      alert('로그아웃에 실패했습니다.');
    }
  };

  const handleAvatarChangeClick = () => {
    avatarInputRef.current.click();
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpdateAvatar(file);
      onClose();
    }
  };

  const handleNicknameChangeClick = () => {
    setIsEditingNickname(true);
  };

  const handleNicknameSave = async () => {
    if (newNickname.trim() === user.displayName) {
      setIsEditingNickname(false);
      return;
    }
    setIsLoading(true);
    const success = await onUpdateNickname(newNickname.trim());
    setIsLoading(false);
    if (success) {
      setIsEditingNickname(false);
    }
  };

  if (!user) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.profileSection}>
          <Image 
            src={user.photoURL} 
            alt="프로필 사진" 
            className={styles.profileImage}
            width={40}
            height={40}
          />
          {!isEditingNickname ? (
            <span className={styles.displayName}>{user.displayName}</span>
          ) : (
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              className={styles.nicknameInput}
              autoFocus
            />
          )}
        </div>

        {!isEditingNickname ? (
          <ul className={styles.menuList}>
            <li className={styles.menuItem} onClick={handleAvatarChangeClick}>아바타 변경</li>
            <li className={styles.menuItem} onClick={handleNicknameChangeClick}>닉네임 변경</li>
            <li className={styles.menuItem}>
              <Link href="/activity" onClick={onClose}>
                내 활동 내역
              </Link>
            </li>
            <li className={styles.menuItem} onClick={handleLogout}>로그아웃</li>
          </ul>
        ) : (
          <div className={styles.editControls}>
            <button onClick={() => setIsEditingNickname(false)} disabled={isLoading}>취소</button>
            <button onClick={handleNicknameSave} disabled={isLoading}>
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        )}

        <input
          type="file"
          ref={avatarInputRef}
          onChange={handleAvatarFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

export default ProfileModal;