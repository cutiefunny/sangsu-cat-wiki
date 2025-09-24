"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
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
import { usePhotos } from "../hooks/usePhotos";
import { useModal } from "../hooks/useModal";
import { fetchRecentPhotos } from "../lib/firebase/photoService";

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
  
  const { 
    photos, 
    isLoading: isPhotosLoading,
    isUploading, 
    refreshPhotos,
    uploadPhoto, 
    deletePhoto, 
    handleSaveCatProfile,
    photoToCreateProfileFor,
    setPhotoToCreateProfileFor
  } = usePhotos(user);

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
  
  // ### 지도 상태를 center와 zoom으로 통합 관리 ###
  const [mapViewState, setMapViewState] = useState({ center: null, zoom: 13 });
  
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [isLoadingRecentPhotos, setIsLoadingRecentPhotos] = useState(true);
  
  const [showExitToast, setShowExitToast] = useState(false);
  const backPressRef = useRef(false);
  const mapRef = useRef(null);

  useEffect(() => {
    refreshPhotos();
    const loadRecentPhotos = async () => {
      setIsLoadingRecentPhotos(true);
      const photos = await fetchRecentPhotos();
      setRecentPhotos(photos);
      setIsLoadingRecentPhotos(false);
    };
    loadRecentPhotos();
  }, [refreshPhotos]); 

  // ... (다른 useEffect 및 핸들러 함수는 변경 없음) ...
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

  const handleConfirmUpload = useCallback(async () => {
    await uploadPhoto(selectedImage, tempMarker);
    setIsConfirming(false);
    setTempMarker(null);
    setSelectedImage(null);
  }, [selectedImage, tempMarker, uploadPhoto]);
  
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
    const success = await handleSaveCatProfile(catData);
    if(success) {
      closeCreateCatProfileModal();
      setPhotoToCreateProfileFor(null);
    }
  }

  // ### 최근 사진 카드 클릭 핸들러 함수 수정 ###
  const handleRecentPhotoClick = (photo) => {
    mapRef.current?.scrollIntoView({ behavior: 'smooth' });
    // 지도 중심과 zoom 레벨을 함께 업데이트
    setMapViewState({ center: { lat: photo.lat, lng: photo.lng }, zoom: 17 });
    openModal(photo);
  };
  
  // ### 갤러리 사진 클릭 핸들러 함수 수정 ###
  const handleGalleryPhotoClick = (photo) => {
    // 줌 레벨은 유지한 채로 지도 중심만 이동
    setMapViewState(prevState => ({ ...prevState, center: { lat: photo.lat, lng: photo.lng } }));
    openModal(photo);
  };


  return (
    <div className={pageStyles.container}>
      <header className={pageStyles.header}>
        <img src="/images/icon.png" alt="로고" height={40} />
        <div className={pageStyles.userInfo}>
          <ImageUpload
            handleFileSelect={handleFileSelect}
            isConfirming={isConfirming}
            user={user}
            onLoginRequest={openLoginModal}
          />
          {user ? (
            <img
              src={user.photoURL}
              alt="사용자 프로필"
              className={pageStyles.profileImage}
              onClick={openProfileModal}
              style={{ cursor: "pointer" }}
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
            zoom={mapViewState.zoom} // zoom prop 전달
            selectedPhoto={selectedPhoto}
          />
        )}
      </div>

      <PhotoGallery
        photos={visiblePhotos}
        onPhotoClick={handleGalleryPhotoClick} // 수정된 핸들러 연결
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