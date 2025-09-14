"use client";

import { useEffect, useRef } from "react";

function Map({ photos, tempMarker, onTempMarkerChange, isConfirming }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    const { naver } = window;
    if (!mapElement.current || !naver) return;

    // 지도 생성
    const mapOptions = {
      center: new naver.maps.LatLng(37.548, 126.923),
      zoom: 15,
      zoomControl: true,
    };
    mapInstance.current = new naver.maps.Map(mapElement.current, mapOptions);

    // 기존 사진들의 마커 생성
    photos.forEach((photo) => {
      new naver.maps.Marker({
        position: new naver.maps.LatLng(photo.lat, photo.lng),
        map: mapInstance.current,
      });
    });
  }, []);

  useEffect(() => {
    if (mapInstance.current && tempMarker) {
      // 지도를 임시 마커 위치로 이동
      mapInstance.current.setCenter(new naver.maps.LatLng(tempMarker.lat, tempMarker.lng));

      // 드래그 가능한 임시 마커 생성
      const draggableMarker = new naver.maps.Marker({
        position: new naver.maps.LatLng(tempMarker.lat, tempMarker.lng),
        map: mapInstance.current,
        draggable: true,
        icon: {
          content: `<div style="background-color: red; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
          anchor: new naver.maps.Point(12, 12),
        },
      });

      // 드래그가 끝났을 때 이벤트 리스너 추가
      naver.maps.Event.addListener(draggableMarker, 'dragend', () => {
        const newCoord = draggableMarker.getPosition();
        onTempMarkerChange({ lat: newCoord.y, lng: newCoord.x });
      });
    }
  }, [isConfirming, tempMarker]);

  return <div ref={mapElement} style={{ width: "100%", height: "600px" }} />;
}

export default Map;