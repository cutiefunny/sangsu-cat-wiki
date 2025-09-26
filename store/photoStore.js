// store/photoStore.js
import { create } from 'zustand';
import { fetchAllPhotos, fetchRecentPhotos, uploadPhoto as apiUploadPhoto, deletePhoto as apiDeletePhoto } from '../lib/firebase/photoService';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/clientApp';

export const usePhotoStore = create((set, get) => ({
  photos: [],
  recentPhotos: [],
  isLoading: true,
  isLoadingRecent: true,
  isUploading: false,
  photoToCreateProfileFor: null,

  // 전체 사진 데이터 가져오기
  fetchPhotos: async () => {
    set({ isLoading: true });
    try {
      const { photos } = await fetchAllPhotos();
      set({ photos, isLoading: false });
    } catch (error) {
      console.error("Error fetching photos:", error);
      set({ isLoading: false });
    }
  },

  // 최근 사진 데이터 가져오기
  fetchRecent: async () => {
    set({ isLoadingRecent: true });
    try {
      const recent = await fetchRecentPhotos();
      set({ recentPhotos: recent, isLoadingRecent: false });
    } catch (error) {
      console.error("Error fetching recent photos:", error);
      set({ isLoadingRecent: false });
    }
  },

  setPhotoToCreateProfileFor: (photo) => set({ photoToCreateProfileFor: photo }),

  uploadPhoto: async (imageFile, marker, user) => {
    if (!imageFile || !marker || !user) {
      alert("필수 정보가 누락되었습니다.");
      return;
    }
    set({ isUploading: true });
    try {
      await apiUploadPhoto(imageFile, marker, user);
      alert("업로드 완료!");
      await get().fetchPhotos(); // 업로드 후 전체 사진 목록 갱신
    } catch (error) {
      console.error("Upload failed:", error);
      alert("업로드에 실패했습니다.");
    } finally {
      set({ isUploading: false });
    }
  },

  deletePhoto: async (photoId, imageUrl) => {
    if (confirm("정말로 이 사진을 삭제하시겠습니까?")) {
      try {
        await apiDeletePhoto(photoId, imageUrl);
        alert("사진이 삭제되었습니다.");
        await get().fetchPhotos(); // 삭제 후 전체 사진 목록 갱신
        return true;
      } catch (error) {
        console.error("Delete failed:", error);
        alert("삭제에 실패했습니다.");
        return false;
      }
    }
    return false;
  },

  handleSaveCatProfile: async (catData, user) => {
    const { photoToCreateProfileFor } = get();
    if (!user) {
      alert("로그인이 필요합니다.");
      return false;
    }
    if (!photoToCreateProfileFor) {
      alert("오류: 대상 사진 정보가 없습니다.");
      return false;
    }
    try {
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
      await get().fetchPhotos(); // 프로필 생성 후 전체 사진 목록 갱신
      return true;
    } catch (error) {
      console.error("Error saving cat profile: ", error);
      alert("도감 생성에 실패했습니다.");
      return false;
    }
  },
}));