"use client";

import { useEffect, useRef, useState } from "react";

const MAX_ZOOM_LEVEL_FOR_PHOTO = 18;
const REGULAR_ICON_STYLE = 'width: 60px; height: 60px; border-radius: 50%; background-image: url({imageUrl}); background-size: cover; background-position: center center; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);';
const HIGHLIGHTED_ICON_STYLE = 'width: 70px; height: 70px; border-radius: 50%; background-image: url({imageUrl}); background-size: cover; background-position: center center; border: 4px solid #007bff; box-shadow: 0 0 12px rgba(0,123,255,0.8);';

function Map({ photos, tempMarker, onTempMarkerChange, isConfirming, onMarkerClick, onBoundsChange, center, zoom, selectedPhoto, blink }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const tempMarkerRef = useRef(null);
  const existingMarkersRef = useRef([]);
  const [currentZoom, setCurrentZoom] = useState(zoom || 13);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [blinkImage, setBlinkImage] = useState('/images/pin.png');

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

  useEffect(() => {
    if (!mapInstance.current || !isConfirming) return;

    const { naver } = window;
    const listener = naver.maps.Event.addListener(mapInstance.current, 'click', (e) => {
      onTempMarkerChange({ lat: e.coord.lat(), lng: e.coord.lng() });
    });

    return () => {
      naver.maps.Event.removeListener(listener);
    };
  }, [isConfirming, onTempMarkerChange]);

  useEffect(() => {
    const { naver } = window;
    if (!mapInstance.current || !naver) return;
    
    if (isConfirming && tempMarker) {
      if (!tempMarkerRef.current) {
        tempMarkerRef.current = new naver.maps.Marker({
          position: new naver.maps.LatLng(tempMarker.lat, tempMarker.lng),
          map: mapInstance.current,
          draggable: false,
          icon: {
            url: blink ? blinkImage : '/images/pin.png',
            size: new naver.maps.Size(22, 30),
            scaledSize: new naver.maps.Size(22, 30),
            anchor: new naver.maps.Point(11, 15),
          },
        });
      } else {
        tempMarkerRef.current.setPosition(new naver.maps.LatLng(tempMarker.lat, tempMarker.lng));
        tempMarkerRef.current.setIcon({
          url: blink ? blinkImage : '/images/pin.png',
          size: new naver.maps.Size(22, 30),
          scaledSize: new naver.maps.Size(22, 30),
          anchor: new naver.maps.Point(11, 15),
        });
      }
      mapInstance.current.panTo(new naver.maps.LatLng(tempMarker.lat, tempMarker.lng));
    } else {
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setMap(null);
        tempMarkerRef.current = null;
      }
    }
  }, [isConfirming, tempMarker, blink, blinkImage]);

  // --- 점멸 효과 간격 수정 ---
  useEffect(() => {
    let intervalId;
    if (isConfirming && blink) {
      intervalId = setInterval(() => {
        setBlinkImage(prev => prev === '/images/pin.png' ? '/images/pin2.png' : '/images/pin.png');
      }, 500); // 1초(1000ms)에서 0.5초(500ms)로 변경
    } else {
      setBlinkImage('/images/pin.png');
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isConfirming, blink]);

  return <div ref={mapElement} style={{ width: "100%", height: "400px" }} />;
}

export default Map;