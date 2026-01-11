import { Player } from './player.model';
export type ServerMessage =
    | PlayerMessage
    | PlayersUpdatedMessage
    | ResetMessage
    | ErrorMessage
    | LoggedInMessage;
export interface PlayersUpdatedMessage {
    type: 'players';
    players: Player[];
}
export interface PlayerMessage {
    type: 'player';
    player: Player | null;
}
export interface ResetMessage {
    type: 'reset';
}
export interface LoggedInMessage {
    type: 'logged_in';
}
export interface ErrorMessage {
    type: 'error';
    message: string;
}
