"use client";

import { useEffect, useRef, useState } from "react";

const MAX_ZOOM_LEVEL_FOR_PHOTO = 18;

function Map({ photos, tempMarker, onTempMarkerChange, isConfirming, onMarkerClick, onBoundsChange }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const draggableMarkerRef = useRef(null);
  const existingMarkersRef = useRef([]);
  const [currentZoom, setCurrentZoom] = useState(15);

  useEffect(() => {
    const { naver } = window;
    if (!mapElement.current || !naver) return;
    const mapOptions = {
      center: new naver.maps.LatLng(37.548, 126.923),
      zoom: 15,
      zoomControl: true,
    };
    const map = new naver.maps.Map(mapElement.current, mapOptions);
    mapInstance.current = map;
    setCurrentZoom(map.getZoom());
    naver.maps.Event.addListener(map, 'zoom_changed', () => setCurrentZoom(map.getZoom()));
  }, []);

  // 지도 경계가 변경될 때 보이는 사진을 업데이트하는 로직을 별도의 useEffect로 분리
  useEffect(() => {
    if (!mapInstance.current) return;
    const { naver } = window;
    
    const updateVisiblePhotos = () => {
      const bounds = mapInstance.current.getBounds();
      const visible = photos.filter(photo =>
        bounds.hasLatLng(new naver.maps.LatLng(photo.lat, photo.lng))
      );
      onBoundsChange(visible);
    };

    // 'idle' 이벤트 리스너 등록
    const listener = naver.maps.Event.addListener(mapInstance.current, 'idle', updateVisiblePhotos);
    
    // 초기 로드 시에도 한 번 실행
    updateVisiblePhotos();

    // useEffect cleanup 함수: 컴포넌트가 리렌더링되기 전에 리스너를 제거
    return () => {
      naver.maps.Event.removeListener(listener);
    };
  }, [photos, onBoundsChange]); // photos가 바뀔 때마다 리스너를 새로 등록


  useEffect(() => {
    if (!mapInstance.current) return;
    const { naver } = window;
    const photoIds = new Set(photos.map(p => p.id));
    existingMarkersRef.current = existingMarkersRef.current.filter(({ id, marker }) => {
      if (!photoIds.has(id)) {
        marker.setMap(null);
        return false;
      }
      return true;
    });
    const existingMarkerIds = new Set(existingMarkersRef.current.map(m => m.id));
    photos.forEach((photo) => {
      if (!existingMarkerIds.has(photo.id)) {
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(photo.lat, photo.lng),
          map: mapInstance.current,
        });
        naver.maps.Event.addListener(marker, "click", () => onMarkerClick(photo));
        existingMarkersRef.current.push({ id: photo.id, photo: photo, marker: marker });
      }
    });
  }, [photos, onMarkerClick]);

  useEffect(() => {
    if (!mapInstance.current) return;
    const { naver } = window;
    existingMarkersRef.current.forEach(({ photo, marker }) => {
      if (currentZoom >= MAX_ZOOM_LEVEL_FOR_PHOTO) {
        marker.setIcon({
          content: `<div style="width: 60px; height: 60px; border-radius: 50%; background-image: url(${photo.imageUrl}); background-size: cover; background-position: center center; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
          anchor: new naver.maps.Point(30, 30),
        });
      } else {
        marker.setIcon(null);
      }
    });
  }, [currentZoom, photos]);

  useEffect(() => {
    const { naver } = window;
    if (!mapInstance.current || !naver) return;
    if (isConfirming && tempMarker) {
      if (!draggableMarkerRef.current) {
        draggableMarkerRef.current = new naver.maps.Marker({
          position: new naver.maps.LatLng(tempMarker.lat, tempMarker.lng),
          map: mapInstance.current,
          draggable: true,
          icon: {
            content: `<div style="background-color: red; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
            anchor: new naver.maps.Point(12, 12),
          },
        });
        naver.maps.Event.addListener(draggableMarkerRef.current, 'dragend', () => {
          const newCoord = draggableMarkerRef.current.getPosition();
          onTempMarkerChange({ lat: newCoord.y, lng: newCoord.x });
        });
      } else {
        draggableMarkerRef.current.setPosition(new naver.maps.LatLng(tempMarker.lat, tempMarker.lng));
      }
      mapInstance.current.panTo(new naver.maps.LatLng(tempMarker.lat, tempMarker.lng));
    } else {
      if (draggableMarkerRef.current) {
        draggableMarkerRef.current.setMap(null);
        draggableMarkerRef.current = null;
      }
    }
  }, [isConfirming, tempMarker, onTempMarkerChange]);

  return <div ref={mapElement} style={{ width: "100%", height: "400px" }} />;
}

export default Map;