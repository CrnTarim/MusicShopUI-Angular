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
import { UserComponent } from './components/user/user.component';
import { LoginComponent } from './components/login/login.component';
import { FavouritesongsComponent } from './components/favouritesongs/favouritesongs.component';
import { MessageComponent } from './components/message/message.component';
import { DxSelectBoxModule, DxDataGridModule, DxListModule, DxTextBoxModule, DxTagBoxModule, DxButtonModule, DxPieChartModule } from 'devextreme-angular';
import { PersonComponent } from './components/person/person.component';
import { SinglesongsComponent } from './components/singlesongs/singlesongs.component';
import { BeatComponent } from './components/beat/beat.component';
import { SinglebeatComponent } from './components/singlebeat/singlebeat.component';
import { ReportComponent } from './components/report/report.component';

// ng g pipe/singerSearch dedigimiz icin otomatik olusturuldu


@NgModule({
  declarations: [
    AppComponent,
    SingerComponent,
    SingerSearchPipe,
    SingerProfileComponent,
    OrderByPipe,
    UserComponent,
    LoginComponent,
    FavouritesongsComponent,
    MessageComponent,
    PersonComponent,
    SinglesongsComponent,
    BeatComponent,
    SinglebeatComponent,
    ReportComponent ,
    

    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule, // diğer link sayfalarına gidebilmek icin
    HttpClientModule, // http methodları için
    FormsModule, 
    DxSelectBoxModule,
    DxDataGridModule,
    DxListModule,
    DxTextBoxModule,
    FormsModule,
    DxDataGridModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    DxDataGridModule,
    DxTagBoxModule,
    DxButtonModule,
    DxPieChartModule,
    DxPieChartModule, 
    StoreModule.forRoot({activeSingleSong:singlesongReducer})
 
  
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
