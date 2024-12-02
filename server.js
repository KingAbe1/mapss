const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
// Increase payload size limit to 50mb
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure the data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Create shapes directory if it doesn't exist
const shapesDir = path.join(dataDir, 'shapes');
if (!fs.existsSync(shapesDir)) {
    fs.mkdirSync(shapesDir);
}

app.post('/api/save-shapes', (req, res) => {
    const { shapesContent, routeId } = req.body;
    const fileName = `shape_${routeId}.txt`;
    const filePath = path.join(shapesDir, fileName);

    try {
        // Write header and content
        const header = 'shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled\n';
        fs.writeFileSync(filePath, header + shapesContent);
        
        console.log(`Route saved to: ${fileName}`);
        res.json({ success: true, fileName });
    } catch (err) {
        console.error('Error saving shapes:', err);
        res.status(500).json({ error: 'Failed to save shapes' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Shape files will be saved to: ${shapesDir}`);
});
