import { useState } from 'react';
import Maps from './Maps';
import RouteMaps from './RouteMaps';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('stops');

  return (
    <div className="App">
      <nav style={{ padding: '20px', backgroundColor: '#f8f9fa' }}>
        <button
          onClick={() => setCurrentPage('stops')}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Stops Map
        </button>
        <button
          onClick={() => setCurrentPage('route')}
          style={{ padding: '8px 16px' }}
        >
          Route Planner
        </button>
      </nav>

      {currentPage === 'stops' ? <Maps /> : <RouteMaps />}
    </div>
  );
}

export default App;
