"use client";

import { useEffect, useRef } from "react";

function Map({ photos }) {
  const mapElement = useRef(null);

  useEffect(() => {
    const { naver } = window;
    if (!mapElement.current || !naver) return;

    // 지도에 표시할 위치를 지정합니다.
    const location = new naver.maps.LatLng(37.548, 126.923);

    // 지도 옵션을 설정합니다.
    const mapOptions = {
      center: location,
      zoom: 15,
      zoomControl: true,
    };

    // 지도를 생성합니다.
    const map = new naver.maps.Map(mapElement.current, mapOptions);

    // 사진 데이터를 기반으로 마커를 생성합니다.
    photos.forEach((photo) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(photo.lat, photo.lng),
        map: map,
      });

      // 마커 클릭 시 이미지 URL을 alert로 표시합니다. (추후 인포윈도우 등으로 개선 가능)
      naver.maps.Event.addListener(marker, "click", () => {
        alert(photo.imageUrl);
      });
    });
  }, [photos]);

  return <div ref={mapElement} style={{ width: "100%", height: "600px" }} />;
}

export default Map;