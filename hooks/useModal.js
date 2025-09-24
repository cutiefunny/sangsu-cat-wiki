import { useState, useCallback } from 'react';

export const useModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateCatProfileModal, setShowCreateCatProfileModal] = useState(false);

  const openModal = useCallback((photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  }, []);
  
  const openLoginModal = useCallback(() => setShowLoginModal(true), []);
  const closeLoginModal = useCallback(() => setShowLoginModal(false), []);

  const openProfileModal = useCallback(() => setShowProfileModal(true), []);
  const closeProfileModal = useCallback(() => setShowProfileModal(false), []);
  
  const openCreateCatProfileModal = useCallback((photo) => {
    setShowCreateCatProfileModal(true);
    closeModal(); // 기존 사진 모달은 닫기
  }, [closeModal]);
  
  const closeCreateCatProfileModal = useCallback(() => {
    setShowCreateCatProfileModal(false);
  }, []);


  return {
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
    setSelectedPhoto
  };
};