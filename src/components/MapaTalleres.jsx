import { useEffect, useRef } from 'react';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapaTalleres({ talleres, tallerSeleccionado }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current).setView([-12.082, -77.03], 12);
    instanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    talleres.forEach((t) => {
      L.marker([t.lat, t.lng])
        .addTo(map)
        .bindPopup(`<strong>${t.nombre}</strong><br/>${t.direccion} (${t.distrito})<br/>Tel: ${t.telefono}`);
    });

    return () => {
      map.remove();
      instanceRef.current = null;
    };
  }, [talleres]);

  useEffect(() => {
    if (instanceRef.current && tallerSeleccionado) {
      instanceRef.current.flyTo([tallerSeleccionado.lat, tallerSeleccionado.lng], 15);
    }
  }, [tallerSeleccionado]);

  return (
    <div
      ref={mapRef}
      className="border rounded"
      style={{ height: '350px', width: '100%' }}
    />
  );
}