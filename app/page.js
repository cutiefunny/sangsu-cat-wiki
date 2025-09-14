"use client";

import { useState, useEffect, useCallback } from "react"; // useCallback 추가
import dynamic from "next/dynamic";
import ImageUpload from "../components/ImageUpload";
import Modal from "../components/Modal";
import LoginModal from "../components/LoginModal";
import PhotoGallery from "../components/PhotoGallery";
import { db, storage, auth, provider } from "../lib/firebase/clientApp";
import { collection, getDocs, addDoc, doc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import imageCompression from "browser-image-compression";
import EXIF from "exif-js";
import pageStyles from "./page.module.css";
import buttonStyles from "../components/controls.module.css";

const Map = dynamic(() => import("../components/Map"), {
  ssr: false,
});

const formatDate = (date) => {
  const pad = (num) => num.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

export default function Home() {
  const [photos, setPhotos] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [tempMarker, setTempMarker] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [visiblePhotos, setVisiblePhotos] = useState([]);

  const isAdmin = user && user.email === "cutiefunny@gmail.com";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const fetchPhotos = useCallback(async () => {
    const querySnapshot = await getDocs(collection(db, "photos"));
    const photosData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setPhotos(photosData);
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      await signInWithPopup(auth, provider);
      setShowLoginModal(false);
    } catch (error) {
      console.error("Login failed:", error);
    }
  }, []);
  
  const handleFileSelect = useCallback((imageFile) => {
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
  }, [user]);

  const handleTempMarkerChange = useCallback((position) => {
    setTempMarker(position);
  }, []);

  const handleConfirmUpload = useCallback(async () => {
    if (!selectedImage || !tempMarker || !user) return;
    setIsUploading(true);
    const timestamp = formatDate(new Date());
    const newFileName = `${timestamp}.avif`;
    const storageRef = ref(storage, `images/${newFileName}`);
    try {
      const metadata = { contentType: 'image/avif' };
      const snapshot = await uploadBytes(storageRef, selectedImage, metadata);
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
  }, [selectedImage, tempMarker, user, fetchPhotos]);

  const handleMarkerClick = useCallback((photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  }, []);
  
  const handleBoundsChange = useCallback((newVisiblePhotos) => {
    setVisiblePhotos(newVisiblePhotos);
  }, []);

  const handleDeletePhoto = useCallback(async (photoId, imageUrl) => {
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
  }, [isAdmin, fetchPhotos, handleCloseModal]);

  return (
    <div>
      <header className={pageStyles.header}>
        <h1 className={pageStyles.title}>상수동 고양이 지도</h1>
        <div className={pageStyles.userInfo}>
          <ImageUpload
            handleFileSelect={handleFileSelect}
            isConfirming={isConfirming}
          />
          {user && (
            <img
              src={user.photoURL}
              alt="사용자 프로필"
              className={pageStyles.profileImage}
            />
          )}
        </div>
      </header>

      {isConfirming && (
        <div className={pageStyles.confirmSection}>
          <p>지도를 움직여 정확한 위치에 핀을 놓아주세요.</p>
          <button
            className={buttonStyles.button}
            onClick={handleConfirmUpload}
            disabled={isUploading}
          >
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
        onBoundsChange={handleBoundsChange}
      />
      
      <PhotoGallery photos={visiblePhotos} onPhotoClick={handleMarkerClick} />
      
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