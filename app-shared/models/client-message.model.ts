import { Player } from './player.model';
export type ClientMessage =
    | GetPlayerMessage
    | JoinMessageMessage
    | BuySpellMessage
    | ResetGameMessage
    | AddKnowledgePointsMessage
    | AddExperienceMessage
    | LoginMessage
    | JoinCreateGameMessage;
export interface GetPlayerMessage {
    type: 'get:player';
    playerId: string;
}
export interface JoinMessageMessage {
    type: 'join';
    player: Player;
}
export interface BuySpellMessage {
    type: 'buy:spell';
    playerId: string;
    spellId: string;
}
export interface JoinCreateGameMessage {
    type: 'join:create:game';
    password: string;
}
export interface LoginMessage {
    type: 'login';
    password: string;
}
export interface ResetGameMessage {
    type: 'reset:game';
    password: string;
}
export interface AddKnowledgePointsMessage {
    type: 'add:knowledgePoints';
    password: string;
    playerId: string;
    amount: number;
}
export interface AddExperienceMessage {
    type: 'add:experience';
    password: string;
    playerId: string;
    amount: number;
}
