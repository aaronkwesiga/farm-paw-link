import { useEffect, useRef, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useVetPresence } from "@/hooks/useVetPresence";

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
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isVetOnline, getOnlineVetData } = useVetPresence();

  // Get live location for a vet (real-time if online, or database location)
  const getVetLiveLocation = (vet: VetProfile) => {
    const onlineData = getOnlineVetData(vet.user_id);
    if (onlineData?.latitude && onlineData?.longitude) {
      return { lat: onlineData.latitude, lng: onlineData.longitude, isLive: true };
    }
    if (vet.latitude !== null && vet.longitude !== null) {
      return { lat: vet.latitude, lng: vet.longitude, isLive: false };
    }
    return null;
  };

  // Create marker icon based on online status and selection
  const createMarkerIcon = (isOnline: boolean, isSelected: boolean) => {
    let fillColor = "#6b7280"; // Gray for offline
    if (isOnline) {
      fillColor = "#22c55e"; // Green for online
    }
    if (isSelected) {
      fillColor = "#3b82f6"; // Blue for selected
    }
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: isOnline ? 14 : 10,
      fillColor,
      fillOpacity: 1,
      strokeColor: isOnline ? "#16a34a" : "#ffffff",
      strokeWeight: isOnline ? 3 : 2,
    };
  };

  useEffect(() => {
    const initMap = async () => {
      try {
        // Fetch API key from edge function
        const { data, error: fetchError } = await supabase.functions.invoke('get-maps-key');
        
        if (fetchError || !data?.apiKey) {
          console.error("Failed to fetch Maps API key:", fetchError);
          setError("Google Maps API key not configured");
          setIsLoading(false);
          return;
        }

        const apiKey = data.apiKey;

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
      } catch (err) {
        console.error("Error initializing map:", err);
        setError("Failed to initialize map");
        setIsLoading(false);
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

  // Update markers when vets or online status changes
  useEffect(() => {
    if (!googleMapRef.current || isLoading || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidLocation = false;
    const currentMarkerIds = new Set<string>();

    vets.forEach((vet) => {
      const location = getVetLiveLocation(vet);
      if (!location) return;

      const position = { lat: location.lat, lng: location.lng };
      bounds.extend(position);
      hasValidLocation = true;
      currentMarkerIds.add(vet.id);

      const vetIsOnline = isVetOnline(vet.user_id);
      const isSelected = selectedVet?.id === vet.id;
      const icon = createMarkerIcon(vetIsOnline, isSelected);

      // Check if marker already exists
      const existingMarker = markersRef.current.get(vet.id);
      
      if (existingMarker) {
        // Update existing marker position and icon
        existingMarker.setPosition(position);
        existingMarker.setIcon(icon);
        existingMarker.setTitle(vet.full_name + (vetIsOnline ? " (Online)" : ""));
      } else {
        // Create new marker
        const marker = new window.google.maps.Marker({
          map: googleMapRef.current,
          position,
          title: vet.full_name + (vetIsOnline ? " (Online)" : ""),
          icon,
          animation: vetIsOnline ? window.google.maps.Animation.DROP : undefined,
        });

        // Add info window for live vets
        if (vetIsOnline) {
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 120px;">
                <strong style="color: #22c55e;">● Live</strong>
                <p style="margin: 4px 0 0 0; font-weight: 600;">${vet.full_name}</p>
                ${vet.specialization ? `<p style="margin: 2px 0 0 0; color: #666; font-size: 12px;">${vet.specialization}</p>` : ''}
              </div>
            `,
          });
          
          marker.addListener("mouseover", () => {
            infoWindow.open(googleMapRef.current, marker);
          });
          
          marker.addListener("mouseout", () => {
            infoWindow.close();
          });
        }

        marker.addListener("click", () => onSelectVet(vet));
        markersRef.current.set(vet.id, marker);
      }
    });

    // Remove markers for vets that are no longer in the list
    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    // Fit bounds only on initial load or when vets change significantly
    if (hasValidLocation && vets.length > 1) {
      googleMapRef.current.fitBounds(bounds, 50);
    } else if (hasValidLocation && vets.length === 1) {
      googleMapRef.current.setCenter(bounds.getCenter());
      googleMapRef.current.setZoom(14);
    }
  }, [vets, isLoading, onSelectVet]);

  // Update marker icons when selection or online status changes (without repositioning)
  useEffect(() => {
    if (!googleMapRef.current || isLoading || !window.google) return;

    vets.forEach((vet) => {
      const marker = markersRef.current.get(vet.id);
      if (marker) {
        const vetIsOnline = isVetOnline(vet.user_id);
        const isSelected = selectedVet?.id === vet.id;
        marker.setIcon(createMarkerIcon(vetIsOnline, isSelected));
        
        // Update position from live data
        const location = getVetLiveLocation(vet);
        if (location) {
          marker.setPosition({ lat: location.lat, lng: location.lng });
        }
      }
    });
  }, [selectedVet, isVetOnline, getOnlineVetData, vets, isLoading]);

  useEffect(() => {
    if (!googleMapRef.current || !selectedVet) return;
    
    const location = getVetLiveLocation(selectedVet);
    if (!location) return;
    
    googleMapRef.current.panTo({ lat: location.lat, lng: location.lng });
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
