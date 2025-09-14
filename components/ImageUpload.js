import { useState } from "react";
import { storage, db } from "../lib/firebase/clientApp";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import EXIF from "exif-js";

function ImageUpload() {
  const [image, setImage] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (image) {
      EXIF.getData(image, function () {
        const lat = EXIF.getTag(this, "GPSLatitude");
        const lng = EXIF.getTag(this, "GPSLongitude");

        if (lat && lng) {
          const latRef = EXIF.getTag(this, "GPSLatitudeRef");
          const lngRef = EXIF.getTag(this, "GPSLongitudeRef");
          const latitude =
            (lat[0] + lat[1] / 60 + lat[2] / 3600) *
            (latRef === "N" ? 1 : -1);
          const longitude =
            (lng[0] + lng[1] / 60 + lng[2] / 3600) *
            (lngRef === "E" ? 1 : -1);

          const storageRef = ref(storage, `images/${image.name}`);
          uploadBytes(storageRef, image).then((snapshot) => {
            getDownloadURL(snapshot.ref).then(async (url) => {
              await addDoc(collection(db, "photos"), {
                imageUrl: url,
                lat: latitude,
                lng: longitude,
              });
              alert("이미지 업로드 완료!");
            });
          });
        } else {
          alert("사진에 위치 정보가 없습니다.");
        }
      });
    }
  };

  return (
    <div>
      <input type="file" onChange={handleImageChange} />
      <button onClick={handleUpload}>업로드</button>
    </div>
  );
}

export default ImageUpload;