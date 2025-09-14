"use client";

import { Container as MapDiv, NaverMap, Marker, useNavermaps } from "react-naver-maps";

function Map({ photos }) {
  const navermaps = useNavermaps();

  return (
    <MapDiv
        style={{
            width: '100%',
            height: '600px',
        }}
    >
        <NaverMap
            defaultCenter={new navermaps.LatLng(37.548, 126.923)}
            defaultZoom={15}
        >
            {photos.map((photo) => (
                <Marker
                    key={photo.id}
                    position={new navermaps.LatLng(photo.lat, photo.lng)}
                    onClick={() => alert(photo.imageUrl)}
                />
            ))}
        </NaverMap>
    </MapDiv>
  );
}

export default Map;