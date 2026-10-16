const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('colyseus');

let WebSocketTransport;
try {
    WebSocketTransport = require('@colyseus/ws-transport').WebSocketTransport;
} catch (err) {
    try {
        WebSocketTransport = require('colyseus').WebSocketTransport;
    } catch (e) {}
}

const { PumpkinArenaRoom } = require('./rooms/PumpkinArena');

const app = express();

// Enable CORS for modern web clients (CrazyGames, local dev, custom domains)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Server Health Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'pumpkin-panic-multiplayer',
        uptime: Math.floor(process.uptime()),
        timestamp: Date.now(),
        version: '1.0.0'
    });
});

// Root welcome
app.get('/', (req, res) => {
    res.send({
        name: 'PUMPKIN PANIC.IO Multiplayer Server',
        status: 'running',
        healthCheck: '/health',
        room: 'pumpkin_arena'
    });
});

// Create HTTP and Colyseus Game Server
const server = http.createServer(app);
const serverOptions = WebSocketTransport ? {
    transport: new WebSocketTransport({
        server: server
    })
} : { server };

const gameServer = new Server(serverOptions);

// Register the authoritative game room
gameServer.define('pumpkin_arena', PumpkinArenaRoom);

const PORT = process.env.PORT || 2567;
server.listen(PORT, () => {
    console.log(`🎃 ==============================================`);
    console.log(`🎃 PUMPKIN PANIC.IO Authoritative Server Online`);
    console.log(`🎃 Port: ${PORT}`);
    console.log(`🎃 Health: http://localhost:${PORT}/health`);
    console.log(`🎃 Room: pumpkin_arena`);
    console.log(`🎃 ==============================================`);
});
