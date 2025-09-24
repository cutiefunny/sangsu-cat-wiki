import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./clientApp";

/**
 * Firestore에서 모든 사진 문서를 가져옵니다.
 * @returns {Promise<{photos: Array}>} 사진 데이터 배열
 */
export const fetchAllPhotos = async () => {
  const photosCollection = collection(db, "photos");
  const q = query(photosCollection, orderBy("createdAt", "desc"));
  
  const querySnapshot = await getDocs(q);
  const photos = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { photos };
};


/**
 * 이미지 파일을 Storage에 업로드하고 Firestore에 사진 문서를 생성합니다.
 * @param {File} imageFile - 압축된 이미지 파일
 * @param {object} marker - 위도(lat), 경도(lng)를 포함한 마커 객체
 * @param {object} user - Firebase 인증 유저 객체
 * @returns {Promise<object>} 새로 생성된 사진 데이터
 */
export const uploadPhoto = async (imageFile, marker, user) => {
  if (!imageFile || !marker || !user) {
    throw new Error("필수 정보가 누락되었습니다.");
  }
  const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
  const newFileName = `${timestamp}.avif`;
  const storageRef = ref(storage, `images/${newFileName}`);

  const metadata = { contentType: "image/avif" };
  const snapshot = await uploadBytes(storageRef, imageFile, metadata);
  const url = await getDownloadURL(snapshot.ref);

  const newPhoto = {
    imageUrl: url,
    lat: marker.lat,
    lng: marker.lng,
    createdAt: new Date(),
    userId: user.uid,
    userName: user.displayName,
    userPhotoURL: user.photoURL,
  };

  const docRef = await addDoc(collection(db, "photos"), newPhoto);
  return { id: docRef.id, ...newPhoto };
};

/**
 * Firestore의 사진 문서와 Storage의 이미지 파일을 삭제합니다.
 * @param {string} photoId - 삭제할 사진 문서의 ID
 * @param {string} imageUrl - 삭제할 이미지의 URL
 */
export const deletePhoto = async (photoId, imageUrl) => {
  await deleteDoc(doc(db, "photos", photoId));
  const imageRef = ref(storage, imageUrl);
  await deleteObject(imageRef);
};