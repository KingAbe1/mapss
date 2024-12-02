import './App.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import Papa from 'papaparse';
import stopsData from './data/stops.csv';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
});

function Maps() {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    // Parse the imported CSV data
    Papa.parse(stopsData, {
      header: true,
      download: true,
      complete: (results) => {
        setLocations(results.data);
      }
    });
  }, []);

  useEffect(() => {
    if (locations.length === 0) {
      return; // Exit if no locations are loaded
    }

    const map = L.map('map').setView([parseFloat(locations[0].stop_lat), parseFloat(locations[0].stop_lon)], 13);

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add markers from locations
    locations.forEach(location => {
      const lat = parseFloat(location.stop_lat);
      const lng = parseFloat(location.stop_lon);

      // Check if the latitude and longitude are valid numbers
      if (!isNaN(lat) && !isNaN(lng)) {
        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(location.stop_name)
          .bindTooltip(`name: ${location.stop_name}, stop code: ${location.stop_code}`, { permanent: false, direction: 'top' }).openTooltip();
      } else {
        console.warn(`Invalid coordinates for location: ${location.stop_name}, lat: ${lat}, lng: ${lng}`);
      }
    });

    return () => {
      map.eachLayer((layer) => {
        if (layer !== tileLayer) {
          map.removeLayer(layer);
        }
      });
      map.remove(); // Remove the map
    };
  }, [locations]);


  return (
    <div className="App" style={{ height: '100vh' }}>
      <div id="map" style={{ height: '100%', width: '100%' }}></div>
    </div>
  );
}

export default Maps;
