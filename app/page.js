"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ImageUpload from "../components/ImageUpload";
import Modal from "../components/Modal";
import LoginModal from "../components/LoginModal";
import { db, storage, auth, provider } from "../lib/firebase/clientApp";
import { collection, getDocs, addDoc, doc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import imageCompression from "browser-image-compression";
import EXIF from "exif-js";


const Map = dynamic(() => import("../components/Map"), {
  ssr: false,
});

export default function Home() {
  const [photos, setPhotos] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [tempMarker, setTempMarker] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null); // imageUrl에서 객체로 변경

  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 관리자 여부를 확인하는 변수
  const isAdmin = user && user.email === "cutiefunny@gmail.com";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      setShowLoginModal(false);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  
  const handleFileSelect = (imageFile) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const processImage = async (file) => {
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 600,
        useWebWorker: true,
        fileType: "image/avif",
        preserveExif: false,
      };
      try {
        EXIF.getData(file, async function () {
          let position;
          const lat = EXIF.getTag(this, "GPSLatitude");
          const lng = EXIF.getTag(this, "GPSLongitude");

          if (lat && lng) {
            const latRef = EXIF.getTag(this, "GPSLatitudeRef");
            const lngRef = EXIF.getTag(this, "GPSLongitudeRef");
            position = {
              lat: (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef === "N" ? 1 : -1),
              lng: (lng[0] + lng[1] / 60 + lng[2] / 3600) * (lngRef === "E" ? 1 : -1),
            };
          } else {
            position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => reject(err)
              );
            });
          }
          const compressedFile = await imageCompression(file, options);
          setSelectedImage(compressedFile);
          setTempMarker(position);
          setIsConfirming(true);
        });
      } catch (error) {
        console.error("Error:", error);
        alert("위치를 가져오거나 이미지 처리 중 오류가 발생했습니다.");
      }
    };
    processImage(imageFile);
  };

  const handleTempMarkerChange = (position) => {
    setTempMarker(position);
  };

  const handleConfirmUpload = async () => {
    if (!selectedImage || !tempMarker || !user) return;
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
        userId: user.uid,
        userName: user.displayName,
        userPhotoURL: user.photoURL,
      });
      alert("업로드 완료!");
      await fetchPhotos();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
      setIsConfirming(false);
      setTempMarker(null);
      setSelectedImage(null);
    }
  };

  const handleMarkerClick = (photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  };

  // 사진 삭제 함수
  const handleDeletePhoto = async (photoId, imageUrl) => {
    if (!isAdmin) {
      alert("삭제 권한이 없습니다.");
      return;
    }
    if (confirm("정말로 이 사진을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, "photos", photoId));
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        alert("사진이 삭제되었습니다.");
        handleCloseModal();
        await fetchPhotos();
      } catch (error) {
        console.error("Delete failed:", error);
        alert("삭제에 실패했습니다.");
      }
    }
  };

  return (
    <div>
      <h1>상수동 고양이 지도</h1>
      <ImageUpload
        handleFileSelect={handleFileSelect}
        isConfirming={isConfirming}
      />
      {user && <p>{user.displayName}님, 안녕하세요!</p>}

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
        onMarkerClick={handleMarkerClick}
      />
      
      {isModalOpen && (
        <Modal
          photo={selectedPhoto}
          onClose={handleCloseModal}
          isAdmin={isAdmin}
          onDelete={handleDeletePhoto}
        />
      )}

      {showLoginModal && (
        <LoginModal
          onLogin={handleGoogleLogin}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}