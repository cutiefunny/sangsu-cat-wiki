"use client";

import { useEffect, useRef } from "react";

function Map({ photos, tempMarker, onTempMarkerChange, isConfirming, onMarkerClick }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const draggableMarkerRef = useRef(null);
  const existingMarkersRef = useRef([]);

  useEffect(() => {
    const { naver } = window;
    if (!mapElement.current || !naver) return;

    const mapOptions = {
      center: new naver.maps.LatLng(37.548, 126.923),
      zoom: 15,
      zoomControl: true,
    };
    mapInstance.current = new naver.maps.Map(mapElement.current, mapOptions);
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    const { naver } = window;

    existingMarkersRef.current.forEach(marker => marker.setMap(null));
    existingMarkersRef.current = [];

    photos.forEach((photo) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(photo.lat, photo.lng),
        map: mapInstance.current,
      });

      // photo 객체 전체를 전달하도록 수정합니다.
      naver.maps.Event.addListener(marker, "click", () => {
        onMarkerClick(photo);
      });
      existingMarkersRef.current.push(marker);
    });
  }, [photos, onMarkerClick]);

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

  return <div ref={mapElement} style={{ width: "100%", height: "600px" }} />;
}

export default Map;