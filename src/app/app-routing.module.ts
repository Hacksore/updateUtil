import { HomeComponent } from './components/home/home.component';
import { UpdateComponent } from './components/update/update.component';
import { HelpComponent } from './components/help/help.component';
import { DownloadComponent } from './components/download/download.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
	{
		path: '',
		component: HomeComponent
	},
	{
		path: 'beginUpdate',
		component: UpdateComponent
	},
	{
		path: 'help',
		component: HelpComponent
	},
	{
		path: 'download',
		component: DownloadComponent
	}
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { useHash: true })],
	exports: [RouterModule]
})
export class AppRoutingModule { }
