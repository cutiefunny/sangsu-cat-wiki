import { useState, useCallback } from 'react';
import {
  fetchAllPhotos,
  uploadPhoto as apiUploadPhoto,
  deletePhoto as apiDeletePhoto,
} from '../lib/firebase/photoService';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/clientApp';

export const usePhotos = (user) => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [photoToCreateProfileFor, setPhotoToCreateProfileFor] = useState(null);

  const refreshPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { photos: allPhotos } = await fetchAllPhotos();
      setPhotos(allPhotos);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadPhoto = async (imageFile, marker) => {
    if (!imageFile || !marker || !user) return;
    setIsUploading(true);
    try {
      await apiUploadPhoto(imageFile, marker, user);
      alert("업로드 완료!");
      await refreshPhotos();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (photoId, imageUrl) => {
    if (confirm("정말로 이 사진을 삭제하시겠습니까?")) {
      try {
        await apiDeletePhoto(photoId, imageUrl);
        alert("사진이 삭제되었습니다.");
        await refreshPhotos();
        return true;
      } catch (error) {
        console.error("Delete failed:", error);
        alert("삭제에 실패했습니다.");
        return false;
      }
    }
    return false;
  };

  const handleSaveCatProfile = useCallback(async (catData) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return false;
    }
    if (!photoToCreateProfileFor) {
      alert("오류: 대상 사진 정보가 없습니다.");
      return false;
    }
    try {
      // ### 도감 생성 시 위치, 대표이미지 정보 추가 ###
      const newCatRef = await addDoc(collection(db, "cats"), {
        ...catData,
        createdAt: new Date(),
        createdBy: user.uid,
        lat: photoToCreateProfileFor.lat,
        lng: photoToCreateProfileFor.lng,
        mainPhotoUrl: photoToCreateProfileFor.imageUrl,
      });

      const photoDocRef = doc(db, "photos", photoToCreateProfileFor.id);
      await updateDoc(photoDocRef, {
        catId: newCatRef.id,
        catName: catData.name,
      });
      alert(`'${catData.name}' 도감이 생성되었습니다.`);
      await refreshPhotos();
      return true;
    } catch (error) {
      console.error("Error saving cat profile: ", error);
      alert("도감 생성에 실패했습니다.");
      return false;
    }
  }, [user, photoToCreateProfileFor, refreshPhotos]);

  return {
    photos,
    isLoading,
    isUploading,
    refreshPhotos,
    uploadPhoto,
    deletePhoto,
    handleSaveCatProfile,
    photoToCreateProfileFor,
    setPhotoToCreateProfileFor,
  };
};