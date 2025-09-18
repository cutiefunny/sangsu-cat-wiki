"use client";

import { useEffect, useRef, useState } from "react";

const MAX_ZOOM_LEVEL_FOR_PHOTO = 18;
const REGULAR_ICON_STYLE = 'width: 60px; height: 60px; border-radius: 50%; background-image: url({imageUrl}); background-size: cover; background-position: center center; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);';
const HIGHLIGHTED_ICON_STYLE = 'width: 70px; height: 70px; border-radius: 50%; background-image: url({imageUrl}); background-size: cover; background-position: center center; border: 4px solid #007bff; box-shadow: 0 0 12px rgba(0,123,255,0.8);';

function Map({ photos, tempMarker, onTempMarkerChange, isConfirming, onMarkerClick, onBoundsChange, center, selectedPhoto }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const draggableMarkerRef = useRef(null);
  const existingMarkersRef = useRef([]);
  const [currentZoom, setCurrentZoom] = useState(15);

  useEffect(() => {
    const { naver } = window;
    if (!mapElement.current || !naver) return;

    // 지도 초기화 함수
    const initializeMap = (centerLatLng) => {
      const mapOptions = {
        center: centerLatLng,
        zoom: 15,
        zoomControl: true,
      };
      const map = new naver.maps.Map(mapElement.current, mapOptions);
      mapInstance.current = map;
      setCurrentZoom(map.getZoom());
      naver.maps.Event.addListener(map, 'zoom_changed', () => setCurrentZoom(map.getZoom()));
    };

    // 기본 위치 (서울 상수동 부근)
    const defaultLocation = new naver.maps.LatLng(37.548, 126.923);

    // Geolocation API를 사용하여 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 성공 시: 현재 위치를 지도의 중심으로 설정
          const currentLocation = new naver.maps.LatLng(position.coords.latitude, position.coords.longitude);
          initializeMap(currentLocation);
        },
        () => {
          // 실패 시: 기본 위치로 설정
          initializeMap(defaultLocation);
        }
      );
    } else {
      // Geolocation API를 지원하지 않는 경우 기본 위치로 설정
      initializeMap(defaultLocation);
    }
  }, []);

  useEffect(() => {
    if (mapInstance.current && center) {
      const { naver } = window;
      mapInstance.current.panTo(new naver.maps.LatLng(center.lat, center.lng));
    }
  }, [center]);

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

    const listener = naver.maps.Event.addListener(mapInstance.current, 'idle', updateVisiblePhotos);
    updateVisiblePhotos();

    return () => {
      naver.maps.Event.removeListener(listener);
    };
  }, [photos, onBoundsChange]);

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
      const isSelected = selectedPhoto && selectedPhoto.id === photo.id;

      if (currentZoom >= MAX_ZOOM_LEVEL_FOR_PHOTO) {
        const style = isSelected ? HIGHLIGHTED_ICON_STYLE : REGULAR_ICON_STYLE;
        const anchor = isSelected ? new naver.maps.Point(35, 35) : new naver.maps.Point(30, 30);
        
        marker.setIcon({
          content: `<div style="${style.replace('{imageUrl}', photo.imageUrl)}"></div>`,
          anchor: anchor,
        });
        marker.setZIndex(isSelected ? 100 : 1);
      } else {
        marker.setIcon(null);
        marker.setZIndex(isSelected ? 100 : 1);
      }
    });
  }, [currentZoom, photos, selectedPhoto]);

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