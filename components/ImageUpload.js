import { useState } from "react";
import EXIF from "exif-js";

function ImageUpload({ onLocationAcquired, isConfirming }) {
  const [image, setImage] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handlePinRequest = () => {
    if (image) {
      // 1. EXIF 정보 확인
      EXIF.getData(image, function () {
        const lat = EXIF.getTag(this, "GPSLatitude");
        const lng = EXIF.getTag(this, "GPSLongitude");

        if (lat && lng) {
          const latRef = EXIF.getTag(this, "GPSLatitudeRef");
          const lngRef = EXIF.getTag(this, "GPSLongitudeRef");
          const latitude =
            (lat[0] + lat[1] / 60 + lat[2] / 3600) *
            (latRef === "N" ? 1 : -1);
          const longitude =
            (lng[0] + lng[1] / 60 + lng[2] / 3600) *
            (lngRef === "E" ? 1 : -1);
          onLocationAcquired(image, { lat: latitude, lng: longitude });
        } else {
          // 2. EXIF 정보 없으면 Geolocation 사용
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                onLocationAcquired(image, { lat: latitude, lng: longitude });
              },
              (error) => {
                console.error("Geolocation error:", error);
                alert("현재 위치를 가져올 수 없습니다. 위치 정보 제공을 허용해주세요.");
              }
            );
          } else {
            alert("이 브라우저에서는 위치 서비스를 지원하지 않습니다.");
          }
        }
      });
    }
  };

  return (
    <div>
      <input type="file" onChange={handleImageChange} accept="image/*" />
      <button onClick={handlePinRequest} disabled={!image || isConfirming}>
        위치 선택하기
      </button>
    </div>
  );
}

export default ImageUpload;