import React from "react";
import modalStyles from "./Modal.module.css";
import buttonStyles from "./controls.module.css"; // 버튼 스타일 import

function LoginModal({ onLogin, onClose }) {
  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={modalStyles.closeButton} onClick={onClose}>
          &times;
        </button>
        <h2>로그인 필요</h2>
        <p>사진을 업로드하려면 로그인이 필요합니다.</p>
        <button className={buttonStyles.button} onClick={onLogin}>
          Google로 로그인
        </button>
      </div>
    </div>
  );
}

export default LoginModal;