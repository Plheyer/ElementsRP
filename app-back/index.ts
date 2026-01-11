import WebSocket, { WebSocketServer } from 'ws';
import {
    BuySpellMessage,
    ClientMessage,
    Player,
    ServerMessage,
    Spell,
    SPELLS,
    BASE_PATH,
    WS_PORT,
} from '@elementsrp/shared';

const wss = new WebSocketServer({ port: WS_PORT });

console.log(`🟢 WebSocket server running on ws://${BASE_PATH}:${WS_PORT}`);

const gameState: { password: string | null; players: Player[] } = {
    password: null,
    players: [],
};
let gameMaster: WebSocket[] = [];

function broadcast(message: ServerMessage) {
    const data = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) client.send(data);
    });
}

function send(ws: WebSocket, message: ServerMessage) {
    ws.send(JSON.stringify(message));
}

wss.on('connection', (ws) => {
    console.log('🔌 Client connected');

    ws.on('message', (raw) => {
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

            upsertPlayer(msg.player);
            sendToGM({ type: 'players', players: gameState.players });
            send(ws, { type: 'players', players: gameState.players });
            break;

        case 'buy:spell':
            if (!requireGame(ws)) return;
            player = requirePlayer(ws, msg.playerId);
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
            player.knowledgePoints += msg.amount;

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

function sendToGM(message: ServerMessage) {
    const data = JSON.stringify(message);
    gameMaster.forEach((gm) => {
        if (gm.readyState === WebSocket.OPEN) gm.send(data);
    });
}

function canBuySpell(player: Player, spell: Spell): boolean {
    for (const depId of spell.dependencies) {
        if (!player.spells[depId]) return false;
    }
    return true;
}

function checkStarSpellRequirements(player: Player, spell: Spell): boolean {
    if (!spell.isStar) return false;
    const familyStars = SPELLS.filter(
        (s) => s.family === spell.family && !!s.isStar
    );
    for (const starSpell of familyStars) {
        if (player.spells[starSpell.id]) {
            return false;
        }
    }
    return true;
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
    if (checkStarSpellRequirements(player, spell)) {
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
