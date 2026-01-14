const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static('public'));

const PROVIDER = 'openai'; 
const MODEL = 'gpt-4o-mini';
const OPENAI_API_ENDPOINT = "https://openai-api-proxy-746164391621.us-west1.run.app";

let promptTemplate = fs.readFileSync('prompt.md', 'utf8');

// AIへのリクエスト処理
app.post('/api/', async (req, res) => {
    try {
        const { trouble } = req.body;
        let finalPrompt = promptTemplate.replace(/\$\{trouble\}/g, trouble || "");

        const apiKey = process.env.OPENAI_API_KEY;
        const response = await fetch(OPENAI_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'system', content: finalPrompt }],
                response_format: { type: "json_object" }
            })
        });
        const data = await response.json();
        const parsedData = JSON.parse(data.choices[0].message.content);
        res.json({ data: Object.values(parsedData).find(Array.isArray) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Socket.io の接続処理 (スマホからのセンサー値をPCへ転送)
io.on('connection', (socket) => {
    console.log('A user connected');
    
    // スマホから届いたデータを全ユーザー（PC）に送る
    socket.on('sensor', (data) => {
        io.emit('sensor_data', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});