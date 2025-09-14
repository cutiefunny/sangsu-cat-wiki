import { useState } from "react";
import { storage, db } from "../lib/firebase/clientApp";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import EXIF from "exif-js";

function ImageUpload() {
  const [image, setImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  // Firebase에 사진과 위치 정보를 업로드하는 함수를 분리하여 재사용합니다.
  const uploadPhoto = async (latitude, longitude) => {
    if (!image) return;

    setIsUploading(true);
    const storageRef = ref(storage, `images/${Date.now()}_${image.name}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, image);
      const url = await getDownloadURL(snapshot.ref);
      await addDoc(collection(db, "photos"), {
        imageUrl: url,
        lat: latitude,
        lng: longitude,
        createdAt: new Date(),
      });
      alert("이미지 업로드 완료!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
      setImage(null);
      // input 값 초기화
      document.querySelector('input[type="file"]').value = "";
    }
  };

  const handleUpload = () => {
    if (image) {
      EXIF.getData(image, function () {
        const lat = EXIF.getTag(this, "GPSLatitude");
        const lng = EXIF.getTag(this, "GPSLongitude");

        if (lat && lng) {
          // 1. EXIF 정보가 있을 경우
          const latRef = EXIF.getTag(this, "GPSLatitudeRef");
          const lngRef = EXIF.getTag(this, "GPSLongitudeRef");
          const latitude =
            (lat[0] + lat[1] / 60 + lat[2] / 3600) *
            (latRef === "N" ? 1 : -1);
          const longitude =
            (lng[0] + lng[1] / 60 + lng[2] / 3600) *
            (lngRef === "E" ? 1 : -1);
          
          uploadPhoto(latitude, longitude);
        } else {
          // 2. EXIF 정보가 없을 경우, Geolocation API 사용
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                uploadPhoto(latitude, longitude);
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
      <button onClick={handleUpload} disabled={!image || isUploading}>
        {isUploading ? "업로드 중..." : "업로드"}
      </button>
    </div>
  );
}

export default ImageUpload;