import { useRef } from "react";
import styles from "./controls.module.css"; // 버튼 스타일 import

function ImageUpload({ handleFileSelect, isConfirming, user, onLoginRequest }) {
  const fileInputRef = useRef(null);

  const onFileChange = async (e) => {
    const imageFile = e.target.files[0];
    if (!imageFile) return;
    handleFileSelect(imageFile);
  };

  const handleButtonClick = () => {
    // 로그인 상태가 아니면 onLoginRequest 함수를 호출합니다.
    if (!user) {
      onLoginRequest();
    } else {
      // 로그인 상태이면 파일 선택창을 엽니다.
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
        className={styles.button}
        onClick={handleButtonClick} // 수정된 클릭 핸들러를 연결합니다.
        disabled={isConfirming}
      >
        사진 올리기
      </button>
    </div>
  );
}

export default ImageUpload;