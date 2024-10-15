import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SingerComponent } from './components/singer/singer.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SingerSearchPipe } from './pipe/singer-search.pipe';
import { SingerProfileComponent } from './components/singer-profile/singer-profile.component';
import { OrderByPipe } from './pipe/order-by.pipe';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import { singlesongReducer } from './state/song/song.reducer';




@NgModule({
  declarations: [
    AppComponent,
    SingerComponent,
    SingerSearchPipe,
    SingerProfileComponent,
    OrderByPipe // ng g pipe/singerSearch dedigimiz icin otomatik olusturuldu

    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule, // diğer link sayfalarına gidebilmek icin
    HttpClientModule, // http methodları için
    FormsModule, 
    StoreModule.forRoot({activeSingleSong:singlesongReducer})
 
  
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
