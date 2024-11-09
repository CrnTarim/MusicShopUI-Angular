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

  startConnection(userId: string) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:7151/chatHub')
      .build();

    this.hubConnection.start()
      .then(() => {
        console.log('SignalR bağlantısı kuruldu');
        // Backend’e userId'yi kaydet
        this.hubConnection.invoke('RegisterUser', userId);
      })
      .catch(err => console.error('Bağlantı hatası:', err));

    this.hubConnection.on('ReceiveMessage', (message: string) => {
      this.messageSource.next(message);  // Mesaj geldiğinde güncelle
    });
  }

  // Belirli bir kullanıcıya mesaj gönder
  sendMessageToUser(targetUserId: string, message: string): void {
    this.hubConnection.invoke('SendMessageToUser', targetUserId, message)
      .catch(err => console.error('Mesaj gönderme hatası:', err));
  }
}
