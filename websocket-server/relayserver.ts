import * as WebSocket from 'ws';
import * as dotenv from 'dotenv';

const VERBOSE = false;

dotenv.config({ path: '../nextjs-app/.env' });

if (!process.env.WSS_PORT) {
    throw new Error('WSS_PORT is not defined');
}

const port = Number(process.env.WSS_PORT);
const server = new WebSocket.Server({ port });
const clients = new Set<WebSocket.WebSocket>();

// Log when the WebSocket server starts
console.log(`Started WebSocket server on port ${port}`);

server.on('connection', (client) => {
  clients.add(client);

  // Log when a new client connects
  console.log('Client connected');

  client.on('message', (data, isBinary) => {
    if (VERBOSE) {
      console.log("=========================================");
      console.log(`Received data: ${data}`);
      console.log("=========================================");
    }

    const message = isBinary ? data : data.toString();
    
    // Relay data to all other clients
    for (const otherClient of clients) {
      if (otherClient !== client) {
        otherClient.send(message);
      }
    }
  });

  client.on('close', () => {
    clients.delete(client);

    // Log when a client disconnects
    console.log('Client disconnected');
  });
});