import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import { db, auth, provider, storage } from '../lib/firebase/clientApp';

export const useAuth = () => {
  const [user, setUser] = useState(null);
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

  const handleGoogleLogin = useCallback(async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }, []);

  const updateUserRecords = async (uid, updateData) => {
    const batch = writeBatch(db);
    const photosQuery = query(collection(db, "photos"), where("userId", "==", uid));
    const photosSnapshot = await getDocs(photosQuery);
    photosSnapshot.forEach((doc) => batch.update(doc.ref, updateData));

    const commentsQuery = query(collection(db, "comments"), where("userId", "==", uid));
    const commentsSnapshot = await getDocs(commentsQuery);
    commentsSnapshot.forEach((doc) => batch.update(doc.ref, updateData));

    const threadsQuery = query(collection(db, "threads"), where("userId", "==", uid));
    const threadsSnapshot = await getDocs(threadsQuery);
    threadsSnapshot.forEach((doc) => batch.update(doc.ref, updateData));
    
    await batch.commit();
  };

  const handleUpdateAvatar = async (file) => {
    if (!user || !file) return;
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 200,
      });
      await uploadBytes(storageRef, compressedFile);
      const newPhotoURL = await getDownloadURL(storageRef);

      await updateProfile(auth.currentUser, { photoURL: newPhotoURL });
      await updateUserRecords(user.uid, { userPhotoURL: newPhotoURL, photoURL: newPhotoURL });

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { photoURL: newPhotoURL }, { merge: true });

      setUser({ ...auth.currentUser });
      alert("아바타가 변경되었습니다.");
    } catch (error) {
      console.error("Avatar update failed:", error);
      alert("아바타 변경에 실패했습니다.");
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
      await updateUserRecords(user.uid, { userName: newNickname, displayName: newNickname });

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { displayName: newNickname }, { merge: true });

      setUser({ ...auth.currentUser });
      alert("닉네임이 변경되었습니다.");
      return true;
    } catch (error) {
      console.error("Nickname update failed:", error);
      alert("닉네임 변경에 실패했습니다.");
      return false;
    }
  };


  return { 
    user, 
    isAdmin, 
    handleGoogleLogin, 
    handleSignOut, 
    handleUpdateAvatar, 
    handleUpdateNickname 
  };
};