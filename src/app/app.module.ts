import "zone.js/dist/zone-mix";
import "reflect-metadata";
import "../polyfills";
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { HttpClientModule, HttpClient } from "@angular/common/http";

import { AppRoutingModule } from "./app-routing.module";

// NG Translate
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";

import { ElectronService } from "./providers/electron.service";

import { AppComponent } from "./app.component";
import { HomeComponent } from "./components/home/home.component";
import { DownloadComponent } from "./components/download/download.component";
import { UpdateComponent } from "./components/update/update.component";
import { HelpComponent } from "./components/help/help.component";

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

@NgModule({
	declarations: [
		AppComponent,
		HomeComponent,
		DownloadComponent,
		UpdateComponent,
		HelpComponent
	],
	imports: [
		BrowserModule,
		FormsModule,
		HttpClientModule,
		AppRoutingModule,
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: (HttpLoaderFactory),
				deps: [HttpClient]
			}
		})
	],
	providers: [ElectronService],
	bootstrap: [AppComponent]
})
export class AppModule { }
