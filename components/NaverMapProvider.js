"use client";

import { NavermapsProvider } from "react-naver-maps";

export default function NaverMapProvider({ children }) {
  return (
    <NavermapsProvider
      ncpClientId={process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID}
    >
      {children}
    </NavermapsProvider>
  );
}