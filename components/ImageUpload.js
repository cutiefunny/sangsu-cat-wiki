import { useRef } from "react";
import styles from "./controls.module.css";
import Image from "next/image";

function ImageUpload({ handleFileSelect, isConfirming, user, onLoginRequest }) {
  const fileInputRef = useRef(null);

  const onFileChange = async (e) => {
    const imageFile = e.target.files[0];
    if (!imageFile) return;
    handleFileSelect(imageFile);
  };

  const handleButtonClick = () => {
    if (!user) {
      onLoginRequest();
    } else {
      fileInputRef.current.click();
    }
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
        className={styles.imageButton}
        onClick={handleButtonClick}
        disabled={isConfirming}
      >
        <Image src="/images/upload.png" alt="사진 올리기" width={40} height={40} />
      </button>
    </div>
  );
}

export default ImageUpload;