const express = require("express");
const path = require("path");
const app = express();
const uploadRoute = require("./routes/uploadRoute");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Serve static files
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadDir));

// Use upload routes
app.use(uploadRoute);

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
