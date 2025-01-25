const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs'); // File System for reading file streams
const FormData = require('form-data'); // Node.js-compatible FormData

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Bot configuration
const TELEGRAM_BOT_TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.ID; // Replace with your Telegram chat ID

// Middleware to parse JSON data
app.use(bodyParser.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './'); // Save files in the current directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.originalname}`);
    },
});

const upload = multer({ storage });

// Function to send a message to Telegram
async function sendMessageToTelegram(message) {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
        });
        console.log('Message sent to Telegram successfully');
    } catch (error) {
        console.error('Error sending message to Telegram:', error.response?.data || error.message);
    }
}

// Function to send a file to Telegram
async function sendFileToTelegram(filePath, fileName) {
    try {
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('document', fs.createReadStream(filePath), fileName);

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, formData, {
            headers: formData.getHeaders(), // Ensure headers are included
        });

        console.log('File sent to Telegram successfully');
    } catch (error) {
        console.error('Error sending file to Telegram:', error.response?.data || error.message);
    }
}

// Endpoint to receive JSON data
app.post('/', async (req, res) => {
    const dataType = req.headers['data-type']; // Extract 'Data-Type' header
    const data = req.body; // Parsed JSON data

    console.log(`Received Data Type: ${dataType}`);
    console.log('Received Data:', data);

    // Send data to Telegram
    const message = `Received Data Type: ${dataType}\nData: ${JSON.stringify(data, null, 2)}`;
    await sendMessageToTelegram(message);

    res.status(200).send({ message: 'Data received and sent to Telegram successfully' });
});

// Endpoint to receive file uploads
app.post('/upload', upload.single('file'), async (req, res) => {
    const fileType = req.body.fileType || 'unknown'; // Extract file type from request body, if provided
    const file = req.file; // File information provided by multer

    if (file) {
        console.log(`Received File Type: ${fileType}`);
        console.log('Received File:', file);

        // Send file to Telegram
        await sendFileToTelegram(file.path, file.originalname);

        res.status(200).send({ message: 'File received and sent to Telegram successfully' });
    } else {
        res.status(400).send({ message: 'No file uploaded' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
