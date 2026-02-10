"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface MapLocation {
  id: number;
  location: string;
  city?: string | null;
  state?: string | null;
  lat: number;
  lng: number;
  contracts: number;
  totalValue: number;
}

interface MapComponentProps {
  locations: MapLocation[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export default function MapComponent({ locations }: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const center: [number, number] =
    locations.length > 0
      ? [locations[0].lat, locations[0].lng]
      : [-14.235, -51.925];

  if (!isMounted) {
    return null;
  }

  return (
    <MapContainer
      center={center}
      zoom={4}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((location) => (
        <Marker key={location.id} position={[location.lat, location.lng]} icon={customIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold text-zinc-900">{location.location}</p>
              <p className="text-sm text-zinc-600">
                {location.contracts} contrato{location.contracts > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-zinc-500">{formatCurrency(location.totalValue)}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
