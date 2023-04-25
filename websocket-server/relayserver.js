"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = __importStar(require("ws"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: '../nextjs-app/.env' });
if (!process.env.WEBSOCKET_SERVER_PORT) {
    throw new Error('WEBSOCKET_SERVER_PORT is not defined');
}
const server = new WebSocket.Server({ port: Number(process.env.WEBSOCKET_SERVER_PORT) });
const clients = new Set();
server.on('connection', (client) => {
    clients.add(client);
    client.on('message', (data) => {
        for (const otherClient of clients) {
            if (otherClient !== client) {
                otherClient.send(data);
            }
        }
    });
    client.on('close', () => {
        clients.delete(client);
    });
});
