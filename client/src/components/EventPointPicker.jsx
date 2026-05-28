import { useMapEvents } from "react-leaflet";

export default function EventPointPicker({ setEventForm }) {
  useMapEvents({
    click(event) {
      setEventForm((prev) => ({
        ...prev,
        latitude: String(event.latlng.lat.toFixed(6)),
        longitude: String(event.latlng.lng.toFixed(6))
      }));
    }
  });
  return null;
}
