import { useEffect, useRef, useState } from "react";
import useGoogleMaps from "../hooks/useGoogleMaps";

interface MapProps {
  center: google.maps.LatLngLiteral;
  zoom?: number;
  className?: string;
}

const Map: React.FC<MapProps> = ({ center, zoom = 15, className = "" }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { google, error } = useGoogleMaps();

  useEffect(() => {
    if (google && mapRef.current && !map) {
      const newMap = new google.maps.Map(mapRef.current, {
        center,
        zoom,
      });
      setMap(newMap);
    }
  }, [google, map, center, zoom]);

  if (error) return <div className={className}>Error loading maps</div>;
  if (!google) return <div className={className}>Loading maps...</div>;

  return (
    <div
      ref={mapRef}
      className={className}
      style={{ height: "100%", width: "100%" }}
    />
  );
};

export default Map;
