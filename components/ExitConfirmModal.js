// components/ExitConfirmModal.js
import React from 'react';
import styles from './ExitConfirmModal.module.css';

function ExitConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p>앱을 종료하시겠습니까?</p>
        <div className={styles.buttonGroup}>
          <button onClick={onCancel} className={styles.cancelButton}>
            취소
          </button>
          <button onClick={onConfirm} className={styles.confirmButton}>
            종료
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExitConfirmModal;