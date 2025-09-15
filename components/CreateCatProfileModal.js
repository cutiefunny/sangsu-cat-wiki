// components/CreateCatProfileModal.js
import React, { useState } from 'react';
import styles from './CreateCatProfileModal.module.css';

function CreateCatProfileModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('고양이 이름은 필수 항목입니다.');
      return;
    }
    setIsLoading(true);
    await onSave({
      name: name.trim(),
      age: age.trim(),
      description: description.trim(),
    });
    setIsLoading(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>새로운 고양이 도감 만들기</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="cat-name">이름</label>
            <input
              id="cat-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="고양이의 이름을 지어주세요"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="cat-age">추정 나이</label>
            <input
              id="cat-age"
              type="text"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="예: 2살, 6개월 등"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="cat-description">특징 및 설명</label>
            <textarea
              id="cat-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="특징이나 자주 나타나는 장소를 알려주세요"
              rows="4"
            />
          </div>
          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} disabled={isLoading} className={styles.cancelButton}>
              취소
            </button>
            <button type="submit" disabled={isLoading} className={styles.saveButton}>
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCatProfileModal;