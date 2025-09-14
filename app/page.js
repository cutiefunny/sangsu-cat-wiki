"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ImageUpload from "../components/ImageUpload";
import { db, storage } from "../lib/firebase/clientApp";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Map = dynamic(() => import("../components/Map"), {
  ssr: false,
});

export default function Home() {
  const [photos, setPhotos] = useState([]);
  
  // 새로 추가된 상태들
  const [isConfirming, setIsConfirming] = useState(false);
  const [tempMarker, setTempMarker] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    const querySnapshot = await getDocs(collection(db, "photos"));
    const photosData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setPhotos(photosData);
  };

  // ImageUpload 컴포넌트에서 호출할 함수
  const handleLocationAcquired = (image, position) => {
    setSelectedImage(image);
    setTempMarker(position);
    setIsConfirming(true);
  };

  // Map 컴포넌트에서 호출할 함수
  const handleTempMarkerChange = (position) => {
    setTempMarker(position);
  };

  // 최종 업로드 확정 함수
  const handleConfirmUpload = async () => {
    if (!selectedImage || !tempMarker) return;

    setIsUploading(true);
    const storageRef = ref(storage, `images/${Date.now()}_${selectedImage.name}`);

    try {
      const snapshot = await uploadBytes(storageRef, selectedImage);
      const url = await getDownloadURL(snapshot.ref);
      await addDoc(collection(db, "photos"), {
        imageUrl: url,
        lat: tempMarker.lat,
        lng: tempMarker.lng,
        createdAt: new Date(),
      });
      alert("업로드 완료!");
      await fetchPhotos(); // 업로드 후 사진 목록 갱신
    } catch (error) {
      console.error("Upload failed:", error);
      alert("업로드에 실패했습니다.");
    } finally {
      // 모든 상태 초기화
      setIsUploading(false);
      setIsConfirming(false);
      setTempMarker(null);
      setSelectedImage(null);
      document.querySelector('input[type="file"]').value = "";
    }
  };

  return (
    <div>
      <h1>상수동 고양이 지도</h1>
      <ImageUpload
        onLocationAcquired={handleLocationAcquired}
        isConfirming={isConfirming}
      />

      {isConfirming && (
        <div>
          <p>지도를 움직여 정확한 위치에 핀을 놓아주세요.</p>
          <button onClick={handleConfirmUpload} disabled={isUploading}>
            {isUploading ? "업로드 중..." : "이 위치에 사진 추가하기"}
          </button>
        </div>
      )}

      <Map
        photos={photos}
        tempMarker={tempMarker}
        onTempMarkerChange={handleTempMarkerChange}
        isConfirming={isConfirming}
      />
    </div>
  );
}