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
  private hubConnection: HubConnection;

  private messageSource = new BehaviorSubject<string>('');  
  message$ = this.messageSource.asObservable();

  private currentConnectionId: any;  
  constructor() {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:7151/chatHub')  
      .build();

    this.hubConnection.start()
      .then(() => {
        console.log('SignalR bağlantısı kuruldu');
        this.currentConnectionId = this.hubConnection.connectionId; 
        console.log('Connection ID:', this.currentConnectionId);  
      })
      .catch(err => {
        console.error('Bağlantı hatası:', err);
      });

    this.hubConnection.on('ReceiveMessage', (message: string) => {
      this.messageSource.next(message);  
    });
  }

  private isConnectionReady(): boolean {
    return this.hubConnection.state === HubConnectionState.Connected;
  }
 
  sendMessageToUser(targetConnectionId: string, message: string): void {
    if (this.isConnectionReady() && targetConnectionId && message.trim()) {
      
      this.hubConnection.invoke('SendMessageToUser', targetConnectionId, message)
        .catch(err => console.error('Mesaj gönderme hatası:', err));
    } else {
      console.error('Bağlantı kurulamadı veya geçerli bağlantı ID bulunamadı');
    }
  } 
}
