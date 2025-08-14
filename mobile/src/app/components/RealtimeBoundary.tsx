import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import OfflineBanner from './OfflineBanner';
import FullScreenLoader from './FullScreenLoader';

interface RealtimeBoundaryProps {
  children: React.ReactNode;
  busy: boolean;
}

export default function RealtimeBoundary({ children, busy }: RealtimeBoundaryProps) {
  const [online, setOnline] = useState(true);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      setOnline(Boolean(state.isConnected));
    });
    return unsub;
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (busy) {
      timer = setTimeout(() => setShowLoader(true), 400);
    } else {
      setShowLoader(false);
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [busy]);

  return (
    <>
      <OfflineBanner online={online} />
      {showLoader ? <FullScreenLoader /> : children}
    </>
  );
}