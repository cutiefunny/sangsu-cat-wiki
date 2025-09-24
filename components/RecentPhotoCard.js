import React, { useState, useEffect } from 'react';
import styles from './RecentPhotoCard.module.css'; // 파일 이름 변경에 따라 경로도 변경

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const RecentPhotoCard = ({ photo }) => {
  const [address, setAddress] = useState('위치 정보 로딩 중...');

  useEffect(() => {
    if (photo.lat && photo.lng) {
      const { naver } = window;
      if (!naver || !naver.maps || !naver.maps.Service) {
        return;
      }
      
      const latlng = new naver.maps.LatLng(photo.lat, photo.lng);
      naver.maps.Service.reverseGeocode({
        coords: latlng,
        orders: 'addr',
      }, (status, response) => {
        if (status === naver.maps.Service.Status.OK && response.v2.results.length > 0) {
          const result = response.v2.results[0];
          const region = result.region;
          const addressStr = `${region.area1.name} ${region.area2.name} ${region.area3.name}`;
          setAddress(addressStr);
        } else {
          setAddress('위치를 찾을 수 없습니다.');
        }
      });
    }
  }, [photo.lat, photo.lng]);

  return (
    <div className={styles.card}>
      {/* 이미지와 정보 영역을 묶는 div 추가 */}
      <div className={styles.cardContent}>
        <img src={photo.imageUrl} alt={photo.catName || '길고양이 사진'} className={styles.photo} />
        <div className={styles.info}>
          {photo.catName && <div className={styles.catName}>{photo.catName}</div>}
          <div className={styles.dateTime}>{formatTimestamp(photo.createdAt)}</div>
          <div className={styles.location}>{address}</div>
        </div>
      </div>
    </div>
  );
};

export default RecentPhotoCard;