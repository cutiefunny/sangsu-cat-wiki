"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ImageUpload from "../components/ImageUpload";
import { db } from "../lib/firebase/clientApp";
import { collection, getDocs } from "firebase/firestore";

const Map = dynamic(() => import("../components/Map"), {
  ssr: false,
});

export default function Home() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      const querySnapshot = await getDocs(collection(db, "photos"));
      const photosData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPhotos(photosData);
    };

    fetchPhotos();
  }, []);

  return (
    <div>
      <h1>상수동 고양이 지도</h1>
      <ImageUpload />
      <Map photos={photos} />
    </div>
  );
}