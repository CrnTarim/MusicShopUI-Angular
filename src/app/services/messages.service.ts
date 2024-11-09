import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Message } from '../models/message';
import { BehaviorSubject, catchError, Observable,Subject, throwError} from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private hubConnection!: HubConnection;

  private messageSource = new BehaviorSubject<string>('');  
  message$ = this.messageSource.asObservable();

  constructor() {}

  startConnection(userId: string): void {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:7151/chatHub')
      .build();

   
    this.hubConnection.start()
      .then(() => {
        console.log('SignalR bağlantısı kuruldu');
        this.hubConnection.invoke('RegisterUser', userId);  // Backend’e userId'yi kaydet
      })
      .catch(err => {
        console.error('Bağlantı hatası:', err);
        
        setTimeout(() => this.startConnection(userId), 5000); // 5 saniye sonra tekrar dene
      });

   
    this.hubConnection.on('ReceiveMessage', (message: string) => {
      this.messageSource.next(message);
    });

   
    this.hubConnection.onclose(() => {
      console.log('SignalR bağlantısı kesildi. Yeniden bağlanıyor...');
      setTimeout(() => this.startConnection(userId), 5000); 
    });
  }

 
  sendMessageToUser(targetUserId: string, message: string): void {
    if (this.hubConnection.state === 'Connected') {
      this.hubConnection.invoke('SendMessageToUser', targetUserId, message)
        .catch(err => console.error('Mesaj gönderme hatası:', err));
    }
  }
}
