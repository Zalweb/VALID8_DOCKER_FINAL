import { useEffect, useState } from 'react';

export default function useGoogleMaps() {
  const apiKey = import.meta.env.VITE_GMAPS_KEY;
  const [google, setGoogle] = useState<typeof window.google | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => setGoogle(window.google || null);
      script.onerror = () => setError(new Error('Google Maps failed to load'));

      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    } else {
      setGoogle(window.google);
    }
  }, [apiKey]);

  return { google, error };
}