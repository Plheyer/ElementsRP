import { Injectable, signal } from '@angular/core';
import { ServerMessage, ClientMessage } from '@elementsrp/shared';
import { BASE_PATH, WS_PORT } from 'app-shared/config';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
    private ws?: WebSocket;

    readonly connected = signal(false);
    readonly messages = signal<ServerMessage | null>(null);

    connect(): void {
        if (this.ws) return;

        this.ws = new WebSocket(`ws://${BASE_PATH}:${WS_PORT}`);

        this.ws.onopen = () => this.connected.set(true);
        this.ws.onclose = () => this.connected.set(false);

        this.ws.onmessage = (event) => {
            this.messages.set(JSON.parse(event.data));
        };
    }

    send(message: ClientMessage): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify(message));
    }
}
