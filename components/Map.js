"use client";

import { useEffect, useRef, useState } from "react";

const MAX_ZOOM_LEVEL_FOR_PHOTO = 18;
const REGULAR_ICON_STYLE = 'width: 60px; height: 60px; border-radius: 50%; background-image: url({imageUrl}); background-size: cover; background-position: center center; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);';
const HIGHLIGHTED_ICON_STYLE = 'width: 70px; height: 70px; border-radius: 50%; background-image: url({imageUrl}); background-size: cover; background-position: center center; border: 4px solid #007bff; box-shadow: 0 0 12px rgba(0,123,255,0.8);';

function Map({ photos, tempMarker, onTempMarkerChange, isConfirming, onMarkerClick, onBoundsChange, center, zoom, selectedPhoto }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const tempMarkerRef = useRef(null);
  const existingMarkersRef = useRef([]);
  const [currentZoom, setCurrentZoom] = useState(zoom || 13);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  useEffect(() => {
    const { naver } = window;
    if (!mapElement.current || !naver || isMapInitialized) return;

    const initializeMap = (centerLatLng) => {
      const mapOptions = {
        center: centerLatLng,
        zoom: zoom || 13,
        zoomControl: true,
      };
      const map = new naver.maps.Map(mapElement.current, mapOptions);
      mapInstance.current = map;

      naver.maps.Event.addListener(map, 'zoom_changed', () => {
        setCurrentZoom(map.getZoom());
      });

      setIsMapInitialized(true);
    };

    const defaultLocation = new naver.maps.LatLng(37.548, 126.923);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = new naver.maps.LatLng(position.coords.latitude, position.coords.longitude);
          initializeMap(currentLocation);
        },
        () => {
          initializeMap(defaultLocation);
        }
      );
    } else {
      initializeMap(defaultLocation);
    }
  }, [isMapInitialized, zoom]);

  useEffect(() => {
    if (mapInstance.current && center) {
      const { naver } = window;
      const newCenter = new naver.maps.LatLng(center.lat, center.lng);
      mapInstance.current.morph(newCenter, zoom);
    }
  }, [center, zoom]);

  useEffect(() => {
    if (!isMapInitialized || !mapInstance.current) return;
    const { naver } = window;

    existingMarkersRef.current.forEach(({ marker }) => marker.setMap(null));
    existingMarkersRef.current = [];

    photos.forEach((photo) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(photo.lat, photo.lng),
        map: mapInstance.current,
        icon: {
          url: '/images/pin.png',
          size: new naver.maps.Size(22, 30),
          scaledSize: new naver.maps.Size(22, 30),
          anchor: new naver.maps.Point(11, 15),
        },
      });
      naver.maps.Event.addListener(marker, "click", () => onMarkerClick(photo));
      existingMarkersRef.current.push({ id: photo.id, photo: photo, marker: marker });
    });

    const updateVisiblePhotos = () => {
      if (!mapInstance.current) return;
      const bounds = mapInstance.current.getBounds();
      const visible = photos.filter(photo =>
        bounds.hasLatLng(new naver.maps.LatLng(photo.lat, photo.lng))
      );
      onBoundsChange(visible);
    };

    const idleListener = naver.maps.Event.addListener(mapInstance.current, 'idle', updateVisiblePhotos);
    updateVisiblePhotos();

    return () => {
      naver.maps.Event.removeListener(idleListener);
    };
  }, [isMapInitialized, photos, onMarkerClick, onBoundsChange]);


  useEffect(() => {
    if (!mapInstance.current) return;
    const { naver } = window;

    existingMarkersRef.current.forEach(({ photo, marker }) => {
      const isSelected = selectedPhoto && selectedPhoto.id === photo.id;
      const zIndex = isSelected ? 100 : 1;

      if (currentZoom >= MAX_ZOOM_LEVEL_FOR_PHOTO) {
        const style = isSelected ? HIGHLIGHTED_ICON_STYLE : REGULAR_ICON_STYLE;
        const anchor = isSelected ? new naver.maps.Point(35, 35) : new naver.maps.Point(30, 30);

        marker.setIcon({
          content: `<div style="${style.replace('{imageUrl}', photo.imageUrl)}"></div>`,
          anchor: anchor,
        });
        marker.setZIndex(zIndex);
      } else {
        marker.setIcon({
          url: '/images/pin.png',
          size: new naver.maps.Size(22, 30),
          scaledSize: new naver.maps.Size(22, 30),
          anchor: new naver.maps.Point(11, 15),
        });
        marker.setZIndex(zIndex);
      }
    });
  }, [currentZoom, selectedPhoto]);

  // --- 여기부터 클릭 + 드래그 기능이 합쳐진 부분입니다 ---

  // isConfirming 상태에 따라 임시 마커와 이벤트 리스너들을 관리
  useEffect(() => {
    const { naver } = window;
    if (!mapInstance.current || !naver) return;

    if (isConfirming && tempMarker) {
      // 임시 마커 생성
      tempMarkerRef.current = new naver.maps.Marker({
        position: new naver.maps.LatLng(tempMarker.lat, tempMarker.lng),
        map: mapInstance.current,
        draggable: true, // 드래그 가능
        icon: {
          url: '/images/pin.png',
          size: new naver.maps.Size(22, 30),
          scaledSize: new naver.maps.Size(22, 30),
          anchor: new naver.maps.Point(11, 15),
        },
      });

      // 1. 지도 클릭 이벤트 리스너 추가
      const clickListener = naver.maps.Event.addListener(mapInstance.current, 'click', (e) => {
        onTempMarkerChange({ lat: e.coord.lat(), lng: e.coord.lng() });
      });

      // 2. 마커 드래그 종료 이벤트 리스너 추가
      const dragListener = naver.maps.Event.addListener(tempMarkerRef.current, 'dragend', () => {
        const newCoord = tempMarkerRef.current.getPosition();
        onTempMarkerChange({ lat: newCoord.y, lng: newCoord.x });
      });

      // 마커 생성 시 한 번만 지도를 해당 위치로 이동
      mapInstance.current.panTo(new naver.maps.LatLng(tempMarker.lat, tempMarker.lng));

      // Cleanup 함수: isConfirming이 false가 되면 리스너와 마커를 모두 제거
      return () => {
        naver.maps.Event.removeListener(clickListener);
        naver.maps.Event.removeListener(dragListener);
        if (tempMarkerRef.current) {
          tempMarkerRef.current.setMap(null);
          tempMarkerRef.current = null;
        }
      };
    }
  }, [isConfirming, onTempMarkerChange]);

  // tempMarker 상태가 변경될 때 마커 위치를 동기화
  useEffect(() => {
    if (tempMarkerRef.current && tempMarker) {
      const { naver } = window;
      const newPosition = new naver.maps.LatLng(tempMarker.lat, tempMarker.lng);
      if (!tempMarkerRef.current.getPosition().equals(newPosition)) {
        tempMarkerRef.current.setPosition(newPosition);
      }
    }
  }, [tempMarker]);
  // --- 여기까지 수정된 부분입니다 ---

  return <div ref={mapElement} style={{ width: "100%", height: "400px" }} />;
}

export default Map;