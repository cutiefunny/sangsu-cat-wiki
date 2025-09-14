import { useRef } from "react";
import styles from "./controls.module.css"; // 버튼 스타일 import

function ImageUpload({ handleFileSelect, isConfirming }) {
  const fileInputRef = useRef(null);

  const onFileChange = async (e) => {
    const imageFile = e.target.files[0];
    if (!imageFile) return;
    handleFileSelect(imageFile);
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />
      <button
        className={styles.button} // 스타일 적용
        onClick={() => fileInputRef.current.click()}
        disabled={isConfirming}
      >
        사진 선택
      </button>
    </div>
  );
}

export default ImageUpload;