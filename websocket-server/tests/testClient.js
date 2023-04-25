import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9001');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  ws.send('Hello, server!');
});

ws.on('message', (data) => {
  console.log(`Received from server: ${data}`);
});

ws.on('close', () => {
  console.log('Disconnected from WebSocket server');
});