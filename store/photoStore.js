// store/photoStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fetchAllPhotos, fetchRecentPhotos } from '../lib/firebase/photoService';

export const usePhotoStore = create(
  persist(
    (set, get) => ({
      photos: [],
      recentPhotos: [],
      isLoading: true,
      isLoadingRecent: true,
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
    }),
    {
      name: 'photo-storage', // 스토리지에 저장될 이름
      storage: createJSONStorage(() => localStorage), // localStorage에 저장
      // 어떤 상태를 저장할지 선택 (로딩 상태는 제외)
      partialize: (state) => ({ photos: state.photos, recentPhotos: state.recentPhotos }),
    }
  )
);