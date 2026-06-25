"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface PickedLocation {
  lat: number;
  lng: number;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface Props {
  initialLat?: number;
  initialLng?: number;
  onPick: (loc: PickedLocation) => void;
}

// Default centre: Phnom Penh, Cambodia
const DEFAULT_LAT = 11.5564;
const DEFAULT_LNG = 104.9282;

async function reverseGeocode(lat: number, lng: number): Promise<Partial<PickedLocation>> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const json = await res.json();
    const a = json.address ?? {};
    return {
      street:      [a.house_number, a.road].filter(Boolean).join(" ") || a.suburb || "",
      city:        a.city || a.town || a.village || a.county || "",
      state:       a.state || a.region || "",
      postal_code: a.postcode || "",
      country:     a.country_code?.toUpperCase() || "KH",
    };
  } catch {
    return {};
  }
}

export default function AddressMapPicker({ initialLat, initialLng, onPick }: Props) {
  const mapRef     = useRef<any>(null);
  const markerRef  = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [label, setLabel]         = useState("Picked Location");

  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return;

    // Dynamically import Leaflet so it only runs client-side
    import("leaflet").then((L) => {
      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const startLat = initialLat ?? DEFAULT_LAT;
      const startLng = initialLng ?? DEFAULT_LNG;

      const map = L.map(containerRef.current!).setView([startLat, startLng], 15);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      const handleLatLng = async (lat: number, lng: number) => {
        setGeocoding(true);
        const geo = await reverseGeocode(lat, lng);
        setGeocoding(false);
        onPick({ lat, lng, street: "", city: "", state: "", postal_code: "", country: "KH", ...geo });
      };

      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        handleLatLng(lat, lng);
      });

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        handleLatLng(e.latlng.lat, e.latlng.lng);
      });

      // Trigger initial pick if coordinates provided
      if (initialLat && initialLng) {
        handleLatLng(initialLat, initialLng);
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4 text-primary" />
        <span>Click on the map or drag the pin to set your delivery location</span>
        {geocoding && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
      </div>
      <div
        ref={containerRef}
        className="w-full h-64 rounded-xl border overflow-hidden z-0"
        style={{ minHeight: 256 }}
      />
    </div>
  );
}
