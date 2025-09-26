"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image"; // next/image 사용
import ImageUpload from "../components/ImageUpload";
import Modal from "../components/Modal";
import LoginModal from "../components/LoginModal";
import ProfileModal from "../components/ProfileModal";
import PhotoGallery from "../components/PhotoGallery";
import CreateCatProfileModal from "../components/CreateCatProfileModal";
import Toast from "../components/Toast";
import RecentPhotos from "../components/RecentPhotos";
import EXIF from "exif-js";
import imageCompression from "browser-image-compression";
import pageStyles from "./page.module.css";
import buttonStyles from "../components/controls.module.css";

import { useAuth } from "../hooks/useAuth";
import { useModal } from "../hooks/useModal";
// 1. usePhotos 훅 대신 Zustand 스토어를 import 합니다.
import { usePhotoStore } from "../store/photoStore"; 

const Map = dynamic(() => import("../components/Map"), {
  ssr: false,
});

export default function Home() {
  const { 
    user, 
    isAdmin, 
    handleGoogleLogin, 
    handleUpdateAvatar, 
    handleUpdateNickname 
  } = useAuth();
  
  // 2. usePhotos 훅과 관련 useState를 Zustand 스토어로 대체합니다.
  const {
    photos,
    recentPhotos,
    isLoading: isPhotosLoading,
    isLoadingRecent: isLoadingRecentPhotos,
    isUploading,
    photoToCreateProfileFor,
    setPhotoToCreateProfileFor,
    fetchPhotos,
    fetchRecent,
    uploadPhoto,
    deletePhoto,
    handleSaveCatProfile,
  } = usePhotoStore();

  const {
    isModalOpen,
    selectedPhoto,
    showLoginModal,
    showProfileModal,
    showCreateCatProfileModal,
    openModal,
    closeModal,
    openLoginModal,
    closeLoginModal,
    openProfileModal,
    closeProfileModal,
    openCreateCatProfileModal,
    closeCreateCatProfileModal,
  } = useModal();

  const [isConfirming, setIsConfirming] = useState(false);
  const [tempMarker, setTempMarker] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [visiblePhotos, setVisiblePhotos] = useState([]);
  
  const [mapViewState, setMapViewState] = useState({ center: null, zoom: 13 });
  
  const [showExitToast, setShowExitToast] = useState(false);
  const backPressRef = useRef(false);
  const mapRef = useRef(null);

  // 3. 앱 로드 시 Zustand 스토어의 fetch 함수들을 호출합니다.
  useEffect(() => {
    fetchPhotos();
    fetchRecent();
  }, [fetchPhotos, fetchRecent]); 

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      if (!backPressRef.current) {
        backPressRef.current = true;
        setShowExitToast(true);
        setTimeout(() => {
          backPressRef.current = false;
          setShowExitToast(false);
        }, 2000);
        window.history.pushState(null, "", window.location.href);
      } else {
        window.history.back();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleFileSelect = useCallback((imageFile) => {
    const processImage = async (file) => {
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
          
          const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true, fileType: "image/avif" };
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
  }, []);

  // 4. 핸들러 함수들이 Zustand 스토어의 함수를 사용하도록 수정합니다.
  const handleConfirmUpload = useCallback(async () => {
    await uploadPhoto(selectedImage, tempMarker, user); // user 정보를 넘겨줍니다.
    setIsConfirming(false);
    setTempMarker(null);
    setSelectedImage(null);
  }, [selectedImage, tempMarker, uploadPhoto, user]);
  
  const handleDelete = async (photoId, imageUrl) => {
    if (await deletePhoto(photoId, imageUrl)) {
      closeModal();
    }
  };
  
  const handleOpenCreateModal = (photo) => {
    setPhotoToCreateProfileFor(photo);
    openCreateCatProfileModal();
  };

  const handleSaveProfile = async (catData) => {
    const success = await handleSaveCatProfile(catData, user); // user 정보를 넘겨줍니다.
    if(success) {
      closeCreateCatProfileModal();
      setPhotoToCreateProfileFor(null);
    }
  }

  const handleRecentPhotoClick = (photo) => {
    mapRef.current?.scrollIntoView({ behavior: 'smooth' });
    setMapViewState({ center: { lat: photo.lat, lng: photo.lng }, zoom: 17 });
    openModal(photo);
  };
  
  const handleGalleryPhotoClick = (photo) => {
    setMapViewState(prevState => ({ ...prevState, center: { lat: photo.lat, lng: photo.lng } }));
    openModal(photo);
  };

  return (
    <div className={pageStyles.container}>
      <header className={pageStyles.header}>
        <Image src="/images/icon.png" alt="로고" width={40} height={40} />
        <div className={pageStyles.userInfo}>
          <ImageUpload
            handleFileSelect={handleFileSelect}
            isConfirming={isConfirming}
            user={user}
            onLoginRequest={openLoginModal}
          />
          {user ? (
            <Image
              src={user.photoURL}
              alt="사용자 프로필"
              className={pageStyles.profileImage}
              onClick={openProfileModal}
              width={40}
              height={40}
              style={{ cursor: "pointer", borderRadius: '50%' }}
            />
          ) : (
            <div
              className={pageStyles.anonymousAvatar}
              onClick={openLoginModal}
              title="로그인"
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
      
      <div ref={mapRef}>
        {isPhotosLoading ? (
          <div style={{ width: "100%", height: "400px", backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            지도와 사진을 불러오는 중...
          </div>
        ) : (
          <Map
            photos={photos}
            tempMarker={tempMarker}
            onTempMarkerChange={setTempMarker}
            isConfirming={isConfirming}
            onMarkerClick={openModal}
            onBoundsChange={setVisiblePhotos}
            center={mapViewState.center}
            zoom={mapViewState.zoom}
            selectedPhoto={selectedPhoto}
          />
        )}
      </div>

      <PhotoGallery
        photos={visiblePhotos}
        onPhotoClick={handleGalleryPhotoClick}
      />

      <RecentPhotos 
        photos={recentPhotos} 
        isLoading={isLoadingRecentPhotos} 
        onPhotoClick={handleRecentPhotoClick}
      />

      <Toast message="뒤로 가기를 한 번 더 누르면 앱이 종료됩니다." show={showExitToast} />

      {isModalOpen && (
        <Modal
          photo={selectedPhoto}
          onClose={closeModal}
          isAdmin={isAdmin}
          onDelete={handleDelete}
          onLoginRequest={openLoginModal}
          onCreateCatProfile={handleOpenCreateModal}
          user={user}
        />
      )}

      {showCreateCatProfileModal && (
        <CreateCatProfileModal
          onClose={closeCreateCatProfileModal}
          onSave={handleSaveProfile}
        />
      )}
      
      {showLoginModal && (
        <LoginModal
          onLogin={() => {
            handleGoogleLogin().then(() => closeLoginModal());
          }}
          onClose={closeLoginModal}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={closeProfileModal}
          onUpdateAvatar={handleUpdateAvatar}
          onUpdateNickname={handleUpdateNickname}
        />
      )}
    </div>
  );
}