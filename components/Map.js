"use client";

import { useEffect, useRef, useState } from "react";

const MAX_ZOOM_LEVEL_FOR_PHOTO = 18;
const REGULAR_ICON_STYLE = 'width: 60px; height: 60px; border-radius: 50%; background-image: url({imageUrl}); background-size: cover; background-position: center center; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);';
const HIGHLIGHTED_ICON_STYLE = 'width: 70px; height: 70px; border-radius: 50%; background-image: url({imageUrl}); background-size: cover; background-position: center center; border: 4px solid #007bff; box-shadow: 0 0 12px rgba(0,123,255,0.8);';

function Map({ photos, tempMarker, onTempMarkerChange, isConfirming, onMarkerClick, onBoundsChange, center, zoom, selectedPhoto }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const draggableMarkerRef = useRef(null);
  const existingMarkersRef = useRef([]);
  const [currentZoom, setCurrentZoom] = useState(zoom || 13);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  useEffect(() => {
    const { naver } = window;
    if (!mapElement.current || !naver || isMapInitialized) return;

    const initializeMap = (centerLatLng) => {
      const mapOptions = {
        center: centerLatLng,
        zoom: zoom || 13, // 초기 줌 레벨 설정
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

  // ### 지도 중심 및 줌 레벨 이동 로직 수정 ###
  useEffect(() => {
    if (mapInstance.current && center) {
      const { naver } = window;
      const newCenter = new naver.maps.LatLng(center.lat, center.lng);
      
      // morph 메서드를 사용하여 위치와 줌 레벨을 부드럽게 변경
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
        marker.setIcon(null);
        marker.setZIndex(zIndex);
      }
    });
  }, [currentZoom, selectedPhoto]);

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