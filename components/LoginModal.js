import React from "react";
import styles from "./Modal.module.css"; // 기존 Modal 스타일 재활용

function LoginModal({ onLogin, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <h2>로그인 필요</h2>
        <p>사진을 업로드하려면 로그인이 필요합니다.</p>
        <button onClick={onLogin}>Google로 로그인</button>
      </div>
    </div>
  );
}

export default LoginModal;