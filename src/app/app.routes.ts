import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlayerComponent } from './player/player.component';
import { MasterComponent } from './master/master.component';

export const routes: Routes = [
  {
    path: '',
    component: PlayerComponent
  },
  {
    path: 'master',
    component: MasterComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
