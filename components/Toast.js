// components/Toast.js
import React, { useEffect, useState } from 'react';
import styles from './Toast.module.css';

function Toast({ message, show }) {
  if (!show) {
    return null;
  }

  return (
    <div className={`${styles.toast} ${styles.show}`}>
      {message}
    </div>
  );
}

export default Toast;