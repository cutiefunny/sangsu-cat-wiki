import { useRef } from "react";
import EXIF from "exif-js";
import imageCompression from "browser-image-compression";

// handleFileSelect 함수를 props로 받습니다.
function ImageUpload({ handleFileSelect, isConfirming }) {
  const fileInputRef = useRef(null);

  const onFileChange = async (e) => {
    const imageFile = e.target.files[0];
    if (!imageFile) return;
    // 파일이 선택되면 부모 컴포넌트의 함수를 호출합니다.
    handleFileSelect(imageFile);
  };

  return (
    <div>
      {/* input 태그는 숨기고, 버튼 클릭으로 트리거합니다. */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />
      <button onClick={() => fileInputRef.current.click()} disabled={isConfirming}>
        파일 선택
      </button>
    </div>
  );
}

export default ImageUpload;