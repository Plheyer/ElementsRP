import WebSocket, { WebSocketServer } from 'ws';
import {
    BuySpellMessage,
    ClientMessage,
    Player,
    ServerMessage,
    SPELLS,
    BASE_PATH,
    WS_PORT,
    canBuySpell,
    checkStarSpellRequirements,
} from '@elementsrp/shared';
import http from 'http';

const port = Number(process.env.PORT || WS_PORT);

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
    <!doctype html>
    <html>
      <head>
        <meta http-equiv="refresh" content="300">
        <title>Serveur démarré</title>
      </head>
      <body></body>
    </html>
  `);
});

server.listen(port, () => {
    console.log('Server running on port', port);
});

const wss = new WebSocketServer({ server });

console.log(
    `🟢 WebSocket server running on wss://${process.env.BASE_PATH || BASE_PATH}:${port}`,
);

const gameState: { password: string | null; players: Player[] } = {
    password: null,
    players: [],
};
let gameMaster: WebSocket[] = [];

function broadcast(message: ServerMessage) {
    const data = JSON.stringify(message);
    wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) client.send(data);
    });
}

function send(ws: WebSocket, message: ServerMessage) {
    ws.send(JSON.stringify(message));
}

wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 Client connected');

    ws.on('message', (raw: WebSocket.RawData) => {
        let msg: ClientMessage;
        try {
            msg = JSON.parse(raw.toString());
        } catch {
            return send(ws, { type: 'error', message: 'Invalid JSON' });
        }

        handleMessage(ws, msg);
    });

    ws.on('close', () => console.log('❌ Client disconnected'));
});

function handleMessage(ws: WebSocket, msg: ClientMessage) {
    let player: Player | null = null;
    switch (msg.type) {
        case 'get:player':
            if (!requireGame(ws)) return;
            player = requirePlayerByName(ws, msg.playerId);
            if (!player) return;

            send(ws, { type: 'player', player: player });
            break;
        case 'join':
            if (!requireGame(ws)) return;
            if (!requireUniqueName(ws, msg.player.name)) return;

            upsertPlayer(msg.player);
            sendToGM({ type: 'players', players: gameState.players });
            send(ws, { type: 'players', players: gameState.players });
            break;

        case 'buy:spell':
            if (!requireGame(ws)) return;
            player = requirePlayerByName(ws, msg.playerId);
            if (!player) return;

            buySpell(player, msg, ws);
            break;

        case 'join:create:game':
            if (gameState.password) {
                if (!requirePassword(ws, msg.password)) return;
                gameMaster.push(ws);
            } else {
                gameState.password = msg.password;
                gameMaster.push(ws);
            }
            sendToGM({ type: 'players', players: gameState.players });
            break;

        case 'reset:game':
            if (!requireGame(ws)) return;
            if (!requirePassword(ws, msg.password)) return;

            gameState.players = [];
            gameState.password = null;
            gameMaster = [];
            broadcast({ type: 'reset' });
            break;

        case 'add:knowledgePoints':
            if (!requireGame(ws)) return;
            if (!requirePassword(ws, msg.password)) return;
            player = requirePlayer(ws, msg.playerId);
            if (!player) return;

            player.knowledgePoints ??= 0;
            player.knowledgePoints += msg.amount || 0;

            broadcast({ type: 'players', players: gameState.players });
            break;

        case 'add:experience':
            if (!requireGame(ws)) return;
            if (!requirePassword(ws, msg.password)) return;
            player = requirePlayer(ws, msg.playerId);
            if (!player) return;

            player.experience ??= 0;
            player.knowledgePoints += Math.floor(msg.amount / 100);
            player.experience += msg.amount % 100;
            broadcast({ type: 'players', players: gameState.players });
            break;
        default:
            send(ws, { type: 'error', message: 'Action non reconnue.' });
    }
}

function upsertPlayer(player: Player) {
    const index = gameState.players.findIndex((p) => p.id === player.id);
    if (index >= 0) gameState.players[index] = player;
    else gameState.players.push(player);
}

function requireUniqueName(ws: WebSocket, playerName: string): boolean {
    const player = gameState.players.find((p) => p.name === playerName);
    if (player) {
        send(ws, { type: 'error', message: 'Nom déjà utilisé.' });
        return false;
    }
    return true;
}

function sendToGM(message: ServerMessage) {
    const data = JSON.stringify(message);
    gameMaster.forEach((gm) => {
        if (gm.readyState === WebSocket.OPEN) gm.send(data);
    });
}

function buySpell(player: Player, msg: BuySpellMessage, ws: WebSocket) {
    // Sort existe ?
    const spell = SPELLS.find((s) => s.id === msg.spellId);
    if (!spell) {
        send(ws, { type: 'error', message: 'Sort inconnu.' });
        return;
    }
    // Sort déjà acquis ?
    if (player.spells[msg.spellId]) {
        send(ws, { type: 'error', message: 'Sort déjà acquis.' });
        return;
    }
    // Sort possible à l'achat ? (satisfait les dépendances)
    if (!canBuySpell(player, spell)) {
        send(ws, {
            type: 'error',
            message:
                "Conditions d'achat non remplies. Veuillez acheter les sorts précédents.",
        });
        return;
    }
    // Sort star possible à l'achat ?
    if (!checkStarSpellRequirements(player, spell)) {
        send(ws, {
            type: 'error',
            message: 'Vous avez déjà acquis un sort étoilé de cette famille.',
        });
        return;
    }
    // Assez de points pour l'acheter ?
    if (player.knowledgePoints < 1) {
        send(ws, {
            type: 'error',
            message: 'Points de connaissance insuffisants.',
        });
        return;
    }

    player.knowledgePoints -= 1;
    player.spells[msg.spellId] = true;
    sendToGM({ type: 'players', players: gameState.players });
    send(ws, { type: 'players', players: gameState.players });
}

function requireGame(ws: WebSocket): boolean {
    if (!gameState.password) {
        send(ws, { type: 'error', message: 'Aucune partie en cours.' });
        return false;
    }
    return true;
}

function requirePassword(ws: WebSocket, password?: string): boolean {
    if (password !== gameState.password) {
        send(ws, { type: 'error', message: 'Mot de passe incorrect.' });
        return false;
    }
    return true;
}

function requirePlayer(ws: WebSocket, playerId: string): Player | null {
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player) {
        send(ws, { type: 'error', message: 'Joueur non trouvé.' });
        return null;
    }
    return player;
}

function requirePlayerByName(ws: WebSocket, playerName: string): Player | null {
    const player = gameState.players.find((p) => p.name === playerName);
    if (!player) {
        send(ws, { type: 'error', message: 'Joueur non trouvé.' });
        return null;
    }
    return player;
}

function requireNoGame(ws: WebSocket): boolean {
    if (gameState.password)
        send(ws, {
            type: 'error',
            message: 'Une partie est déjà en cours.',
        });
    return !gameState.password;
}
