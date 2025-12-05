"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para ícones do Leaflet no Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Location {
  id: number;
  city: string;
  state: string;
  lat: number;
  lng: number;
  contracts: number;
}

interface MapComponentProps {
  locations: Location[];
}

export default function MapComponent({ locations }: MapComponentProps) {
  // Centro do mapa focado no Nordeste brasileiro
  const center: [number, number] = [-6.5, -37.5];

  return (
    <MapContainer
      center={center}
      zoom={6}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.lat, location.lng]}
          icon={customIcon}
        >
          <Popup>
            <div className="text-center">
              <p className="font-semibold text-zinc-900">
                {location.city}, {location.state}
              </p>
              <p className="text-sm text-zinc-600">
                {location.contracts} contrato{location.contracts > 1 ? "s" : ""} ativo{location.contracts > 1 ? "s" : ""}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
