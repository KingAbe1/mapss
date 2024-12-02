import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import Papa from 'papaparse';
import stopsData from './data/stops.csv';

function RouteMaps() {
  const [map, setMap] = useState(null);
  const [routingControl, setRoutingControl] = useState(null);
  const [stops, setStops] = useState([]);
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedEnd, setSelectedEnd] = useState('');
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    // Parse the CSV data
    Papa.parse(stopsData, {
      header: true,
      download: true,
      complete: (results) => {
        // Filter out any invalid entries and sort the data
        const validStops = results.data.filter(stop => 
          stop && stop.stop_name && stop.stop_id && stop.stop_lat && stop.stop_lon
        ).sort((a, b) => 
          (a.stop_name || '').localeCompare(b.stop_name || '')
        );
        setStops(validStops);
      }
    });

    const mapInstance = L.map('routemap').setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Clear existing markers and routing
  const clearMapElements = () => {
    if (routingControl && map) {
      map.removeControl(routingControl);
      setRoutingControl(null);
    }
    markers.forEach(marker => marker.remove());
    setMarkers([]);
  };

  // Update route when selections change
  useEffect(() => {
    if (!map || !selectedStart || !selectedEnd) return;

    clearMapElements();

    const startStop = stops.find(stop => stop.stop_id === selectedStart);
    const endStop = stops.find(stop => stop.stop_id === selectedEnd);

    if (!startStop || !endStop) return;

    // Add markers for start and end points
    const startMarker = L.marker([parseFloat(startStop.stop_lat), parseFloat(startStop.stop_lon)])
      .bindPopup('Start: ' + startStop.stop_name)
      .addTo(map);
    
    const endMarker = L.marker([parseFloat(endStop.stop_lat), parseFloat(endStop.stop_lon)])
      .bindPopup('End: ' + endStop.stop_name)
      .addTo(map);

    setMarkers([startMarker, endMarker]);

    // Create routing control
    const newRoutingControl = L.Routing.control({
      waypoints: [
        L.latLng(parseFloat(startStop.stop_lat), parseFloat(startStop.stop_lon)),
        L.latLng(parseFloat(endStop.stop_lat), parseFloat(endStop.stop_lon))
      ],
      lineOptions: {
        styles: [{ 
          color: '#2E64FE',
          opacity: 0.8,
          weight: 6
        }]
      },
      createMarker: () => null, // Don't create markers (we create our own)
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false // Don't show turn-by-turn instructions
    }).addTo(map);

    // Listen for route calculation
    newRoutingControl.on('routesfound', function(e) {
      const routes = e.routes;
      const route = routes[0]; // Get the first (best) route
      const coords = route.coordinates;

      // Generate shapes.txt content
      let shapesContent = '';
      const routeId = `${selectedStart}_to_${selectedEnd}`;
      
      coords.forEach((coord, index) => {
        const distanceTraveled = index === 0 ? 0 : 
          coords.slice(0, index + 1).reduce((acc, curr, i, arr) => {
            if (i === 0) return 0;
            const prev = arr[i - 1];
            const d = map.distance([prev.lat, prev.lng], [curr.lat, curr.lng]);
            return acc + d;
          }, 0);

        shapesContent += `${routeId},${coord.lat},${coord.lng},${index},${distanceTraveled.toFixed(2)}\n`;
      });

      // Save to shapes.txt
      fetch('http://localhost:3001/api/save-shapes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          shapesContent,
          routeId: `${selectedStart}_to_${selectedEnd}`
        })
      }).then(response => response.json())
        .then(data => {
          // Update route info
          const routeInfoDiv = document.getElementById('routeInfo');
          if (routeInfoDiv) {
            const distance = (route.summary.totalDistance / 1000).toFixed(2);
            const time = Math.round(route.summary.totalTime / 60);
            
            routeInfoDiv.innerHTML = `
              <div style="font-weight: bold; color: #2E64FE;">Route Information</div>
              <div style="margin-top: 5px;">
                <span style="color: #666;">From:</span> ${startStop.stop_name} 
                <span style="color: #666; margin-left: 10px;">To:</span> ${endStop.stop_name}
              </div>
              <div style="margin-top: 5px;">
                <span style="color: #666;">Distance:</span> ${distance} km 
                <span style="color: #666; margin-left: 10px;">Est. Time:</span> ${time} min
              </div>
              <div style="margin-top: 5px; color: #28a745;">
                Route saved to: ${data.fileName}
              </div>
            `;
          }
        });

    });

    setRoutingControl(newRoutingControl);

  }, [map, selectedStart, selectedEnd, stops]);

  return (
    <div>
      <div style={{ 
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6'
      }}>
        <h2 style={{ marginBottom: '15px' }}>Route Planner</h2>
        <div style={{ 
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ marginRight: '10px' }}>Start Point:</label>
            <select 
              value={selectedStart}
              onChange={(e) => setSelectedStart(e.target.value)}
              style={{ padding: '5px', minWidth: '200px' }}
            >
              <option value="">Select start point</option>
              {stops.map(stop => (
                <option key={stop.stop_id} value={stop.stop_id}>
                  {stop.stop_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ marginRight: '10px' }}>End Point:</label>
            <select 
              value={selectedEnd}
              onChange={(e) => setSelectedEnd(e.target.value)}
              style={{ padding: '5px', minWidth: '200px' }}
            >
              <option value="">Select end point</option>
              {stops.map(stop => (
                <option key={stop.stop_id} value={stop.stop_id}>
                  {stop.stop_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {selectedStart && selectedEnd && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#fff',
            borderRadius: '5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }} id="routeInfo">
            Calculating route...
          </div>
        )}
      </div>
      <div id="routemap" style={{ height: '500px', width: '100%' }}></div>
    </div>
  );
}

export default RouteMaps;