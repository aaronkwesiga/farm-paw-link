import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface VetProfile {
  id: string;
  user_id: string;
  full_name: string;
  latitude: number | null;
  longitude: number | null;
  specialization: string | null;
  is_available: boolean | null;
  profile_image_url: string | null;
}

interface VetMapProps {
  vets: VetProfile[];
  selectedVet: VetProfile | null;
  onSelectVet: (vet: VetProfile) => void;
}

const VetMap = ({ vets, selectedVet, onSelectVet }: VetMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        setError("Google Maps API key not configured");
        setIsLoading(false);
        return;
      }

      // Dynamically load Google Maps script
      if (!window.google) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => createMap();
        script.onerror = () => {
          setError("Failed to load Google Maps");
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } else {
        createMap();
      }
    };

    const createMap = () => {
      if (!mapRef.current || !window.google) return;

      const defaultCenter = vets.length > 0 && vets[0].latitude && vets[0].longitude
        ? { lat: vets[0].latitude, lng: vets[0].longitude }
        : { lat: 0, lng: 0 };

      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 10,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      googleMapRef.current = map;
      setIsLoading(false);
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!googleMapRef.current || isLoading || !window.google) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidLocation = false;

    vets.forEach((vet) => {
      if (vet.latitude === null || vet.longitude === null) return;

      const position = { lat: vet.latitude, lng: vet.longitude };
      bounds.extend(position);
      hasValidLocation = true;

      const marker = new window.google.maps.Marker({
        map: googleMapRef.current,
        position,
        title: vet.full_name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: selectedVet?.id === vet.id ? "#16a34a" : "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => onSelectVet(vet));
      markersRef.current.push(marker);
    });

    if (hasValidLocation && vets.length > 1) {
      googleMapRef.current.fitBounds(bounds, 50);
    } else if (hasValidLocation && vets.length === 1) {
      googleMapRef.current.setCenter(bounds.getCenter());
      googleMapRef.current.setZoom(14);
    }
  }, [vets, isLoading, selectedVet, onSelectVet]);

  useEffect(() => {
    if (!googleMapRef.current || !selectedVet?.latitude || !selectedVet?.longitude) return;
    googleMapRef.current.panTo({ lat: selectedVet.latitude, lng: selectedVet.longitude });
    googleMapRef.current.setZoom(14);
  }, [selectedVet]);

  if (error) {
    return (
      <div className="h-[400px] rounded-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-[400px] rounded-lg" />;
  }

  return <div ref={mapRef} className="h-[400px] rounded-lg" />;
};

export default VetMap;
