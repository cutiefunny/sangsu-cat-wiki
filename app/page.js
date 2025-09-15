"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import ImageUpload from "../components/ImageUpload";
import Modal from "../components/Modal";
import LoginModal from "../components/LoginModal";
import ProfileModal from "../components/ProfileModal";
import PhotoGallery from "../components/PhotoGallery";
// CreateCatProfileModal을 import 합니다.
import CreateCatProfileModal from "../components/CreateCatProfileModal";
import { db, storage, auth, provider } from "../lib/firebase/clientApp";
import {
  collection, getDocs, addDoc, doc, deleteDoc, query, where, writeBatch, getDoc, setDoc, updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { onAuthStateChanged, signInWithPopup, signOut, updateProfile } from "firebase/auth";
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [visiblePhotos, setVisiblePhotos] = useState([]);
  
  // 새로운 상태 변수 추가
  const [showCreateCatProfileModal, setShowCreateCatProfileModal] = useState(false);
  const [photoToCreateProfileFor, setPhotoToCreateProfileFor] = useState(null);

  const isAdmin = user && user.email === "cutiefunny@gmail.com";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
          });
        }
      }
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const fetchPhotos = useCallback(async () => {
    const querySnapshot = await getDocs(collection(db, "photos"));
    const photosData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setPhotos(photosData);
  }, []);

  useEffect(() => { fetchPhotos() }, [fetchPhotos]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      await signInWithPopup(auth, provider);
      setShowLoginModal(false);
    } catch (error) { console.error("Login failed:", error); }
  }, []);

  const updateUserRecords = async (uid, updateData) => {
    const batch = writeBatch(db);
    const photosQuery = query(collection(db, "photos"), where("userId", "==", uid));
    const photosSnapshot = await getDocs(photosQuery);
    photosSnapshot.forEach((doc) => batch.update(doc.ref, updateData));
    const commentsQuery = query(collection(db, "comments"), where("userId", "==", uid));
    const commentsSnapshot = await getDocs(commentsQuery);
    commentsSnapshot.forEach((doc) => batch.update(doc.ref, updateData));
    await batch.commit();
  };

  const handleUpdateAvatar = async (file) => {
    if (!user || !file) return;
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 200 });
      await uploadBytes(storageRef, compressedFile);
      const newPhotoURL = await getDownloadURL(storageRef);

      await updateProfile(auth.currentUser, { photoURL: newPhotoURL });
      await updateUserRecords(user.uid, { userPhotoURL: newPhotoURL });
      
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { photoURL: newPhotoURL }, { merge: true });
      
      setUser({ ...auth.currentUser });
      alert('아바타가 변경되었습니다.');
    } catch (error) {
      console.error("Avatar update failed:", error);
      alert('아바타 변경에 실패했습니다.');
    }
  };

  const handleUpdateNickname = async (newNickname) => {
    if (!user || !newNickname || user.displayName === newNickname) return false;
    try {
      const usersQuery = query(collection(db, "users"), where("displayName", "==", newNickname));
      const querySnapshot = await getDocs(usersQuery);
      if (!querySnapshot.empty) {
        alert("이미 사용 중인 닉네임입니다.");
        return false;
      }
      await updateProfile(auth.currentUser, { displayName: newNickname });
      await updateUserRecords(user.uid, { userName: newNickname });
      
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { displayName: newNickname }, { merge: true });

      setUser({ ...auth.currentUser });
      alert('닉네임이 변경되었습니다.');
      return true;
    } catch (error) {
      console.error("Nickname update failed:", error);
      alert('닉네임 변경에 실패했습니다.');
      return false;
    }
  };

  const handleSignOut = useCallback(async () => {
    try { await signOut(auth); } catch (error) { console.error("Sign out failed:", error); }
  }, []);

  const handleFileSelect = useCallback((imageFile) => {
    const processImage = async (file) => {
      const options = { maxSizeMB: 0.1, maxWidthOrHeight: 600, useWebWorker: true, fileType: "image/avif", preserveExif: false, };
      try {
        EXIF.getData(file, async function () {
          let position;
          const lat = EXIF.getTag(this, "GPSLatitude");
          const lng = EXIF.getTag(this, "GPSLongitude");
          if (lat && lng) {
            const latRef = EXIF.getTag(this, "GPSLatitudeRef");
            const lngRef = EXIF.getTag(this, "GPSLongitudeRef");
            position = { lat: (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef === "N" ? 1 : -1), lng: (lng[0] + lng[1] / 60 + lng[2] / 3600) * (lngRef === "E" ? 1 : -1), };
          } else {
            position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition( (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }), (err) => reject(err) );
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
  }, []);

  const handleTempMarkerChange = useCallback((position) => { setTempMarker(position); }, []);

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
      await addDoc(collection(db, "photos"), { imageUrl: url, lat: tempMarker.lat, lng: tempMarker.lng, createdAt: new Date(), userId: user.uid, userName: user.displayName, userPhotoURL: user.photoURL, });
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

  const handleMarkerClick = useCallback((photo) => { setSelectedPhoto(photo); setIsModalOpen(true); }, []);
  const handleCloseModal = useCallback(() => { setIsModalOpen(false); setSelectedPhoto(null); }, []);
  const handleBoundsChange = useCallback((newVisiblePhotos) => { setVisiblePhotos(newVisiblePhotos); }, []);
  const handleDeletePhoto = useCallback(async (photoId, imageUrl) => {
    if (!isAdmin) { alert("삭제 권한이 없습니다."); return; }
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
  const handleLoginRequest = () => { setShowLoginModal(true); };

  // '도감 만들기' 모달을 여는 함수
  const handleOpenCreateCatProfileModal = useCallback((photo) => {
    setPhotoToCreateProfileFor(photo);
    setShowCreateCatProfileModal(true);
    setIsModalOpen(false); // 기존 사진 상세 모달은 닫기
  }, []);

  // 새로운 고양이 프로필을 저장하는 함수
  const handleSaveCatProfile = useCallback(async (catData) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!photoToCreateProfileFor) {
      alert("오류: 대상 사진 정보가 없습니다.");
      return;
    }

    try {
      // 1. 'cats' 컬렉션에 새로운 고양이 정보 추가
      const newCatRef = await addDoc(collection(db, 'cats'), {
        ...catData,
        createdAt: new Date(),
        createdBy: user.uid,
      });

      // 2. 'photos' 컬렉션의 해당 사진 문서에 catId와 catName 업데이트
      const photoDocRef = doc(db, 'photos', photoToCreateProfileFor.id);
      await updateDoc(photoDocRef, {
        catId: newCatRef.id,
        catName: catData.name,
      });

      alert(`'${catData.name}' 도감이 생성되었습니다.`);
      setShowCreateCatProfileModal(false);
      setPhotoToCreateProfileFor(null);
      await fetchPhotos(); // 전체 사진 목록 새로고침

    } catch (error) {
      console.error("Error saving cat profile: ", error);
      alert("도감 생성에 실패했습니다.");
    }
  }, [user, photoToCreateProfileFor, fetchPhotos]);

  return (
    <div>
      <header className={pageStyles.header}>
        <h1 className={pageStyles.title}>상수동 고양이 지도</h1>
        <div className={pageStyles.userInfo}>
          <ImageUpload handleFileSelect={handleFileSelect} isConfirming={isConfirming} user={user} onLoginRequest={handleLoginRequest} />
          {user ? (
            <img src={user.photoURL} alt="사용자 프로필" className={pageStyles.profileImage} onClick={() => setShowProfileModal(true)} style={{ cursor: 'pointer' }} />
          ) : (
            <div className={pageStyles.anonymousAvatar} onClick={() => setShowLoginModal(true)} title="로그인" />
          )}
        </div>
      </header>
      {isConfirming && (
        <div className={pageStyles.confirmSection}>
          <p>지도를 움직여 정확한 위치에 핀을 놓아주세요.</p>
          <button className={buttonStyles.button} onClick={handleConfirmUpload} disabled={isUploading}>
            {isUploading ? "업로드 중..." : "이 위치에 사진 추가하기"}
          </button>
        </div>
      )}
      <Map photos={photos} tempMarker={tempMarker} onTempMarkerChange={handleTempMarkerChange} isConfirming={isConfirming} onMarkerClick={handleMarkerClick} onBoundsChange={handleBoundsChange} />
      <PhotoGallery photos={visiblePhotos} onPhotoClick={handleMarkerClick} />
      
      {isModalOpen && (
        <Modal
          photo={selectedPhoto}
          onClose={handleCloseModal}
          isAdmin={isAdmin}
          onDelete={handleDeletePhoto}
          onLoginRequest={handleLoginRequest}
          onCreateCatProfile={handleOpenCreateCatProfileModal} // prop 전달
        />
      )}

      {showCreateCatProfileModal && (
        <CreateCatProfileModal
          onClose={() => setShowCreateCatProfileModal(false)}
          onSave={handleSaveCatProfile}
        />
      )}

      {showLoginModal && ( <LoginModal onLogin={handleGoogleLogin} onClose={() => setShowLoginModal(false)} /> )}
      {showProfileModal && ( <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onUpdateAvatar={handleUpdateAvatar} onUpdateNickname={handleUpdateNickname} /> )}
    </div>
  );
}