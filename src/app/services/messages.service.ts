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
  private hubConnection!: HubConnection; // ! nullable değildir

  private messageSource = new BehaviorSubject<string>(''); // Anlık mesaj verisi için bir BehaviorSubject
  message$ = this.messageSource.asObservable(); // Mesaj akışını sağlayan observable. Bu, component ya da servislerin mesajları abone olabilmesini sağlar.

  constructor() {}

  startConnection(userId: string): void {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:7151/chatHub')
      .build();

   
    this.hubConnection.start() 
      .then(() => {
        console.log('SignalR bağlantısı kuruldu');
        this.hubConnection.invoke('RegisterUser', userId); // Backend'deki RegisterUser metoduna userId gönderilir
      })
      .catch(err => {
        console.error('Bağlantı hatası:', err);
        
        setTimeout(() => this.startConnection(userId), 5000); 
      });

    // SignalR sunucusundan gelen 'ReceiveMessage' mesajları dinlenir
    this.hubConnection.on('ReceiveMessage', (message: string) => {
      this.messageSource.next(message);
    });

      // SignalR bağlantısı kapandığında yeniden bağlanmak için otomatik yeniden bağlanma mekanizması eklenir  startConnection(userId: string)
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
