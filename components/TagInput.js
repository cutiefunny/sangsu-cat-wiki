import React, { useState } from 'react';
import styles from './TagInput.module.css';

const TagInput = ({ tags, setTags }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={styles.tagInputContainer}>
      <ul className={styles.tagList}>
        {tags.map(tag => (
          <li key={tag} className={styles.tag}>
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className={styles.removeTagButton}>&times;</button>
          </li>
        ))}
        <li className={styles.tagInput}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder="태그 입력 후 Enter..."
          />
        </li>
      </ul>
    </div>
  );
};

export default TagInput;