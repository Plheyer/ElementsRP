import { Routes } from '@angular/router';
import { LogoPageComponent } from './components/logo-page/logo-page.component';
import { PlayerSetupComponent } from './components/player-setup/player-setup.component';
import { GameMasterComponent } from './components/game-master/game-master.component';
import { PlayerViewComponent } from './components/player-view/player-view.component';

export const routes: Routes = [
    { path: '', component: LogoPageComponent },
    { path: 'setup', component: PlayerSetupComponent },
    { path: 'game-master', component: GameMasterComponent },
    { path: 'player/:playerId', component: PlayerViewComponent },
    { path: '**', redirectTo: '' },
];
