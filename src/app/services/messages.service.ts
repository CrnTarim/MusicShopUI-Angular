import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Message } from '../models/message';
import { Observable,Subject} from 'rxjs';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private url = 'https://localhost:7151/api/Message'; 
  private hubConnection!: signalR.HubConnection;
  private messageReceived = new Subject<Message>(); 

  messageReceived$ = this.messageReceived.asObservable(); 

  constructor(private http: HttpClient) {
    this.startSignalRConnection(); 
  }

 
  private startSignalRConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7151/chatHub') 
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR bağlantısı başarılı');
      })
      .catch(err => console.error('SignalR bağlantı hatası: ', err));

    
      this.hubConnection.on('ReceiveMessage', (senderId: string, receiverId: string, content: string) => {
        console.log('Mesaj alındı:', { senderId, receiverId, content }); 
        const receivedMessage: Message = {
          senderId,
          receiverId,
          content
        };
        this.messageReceived.next(receivedMessage); 
      });
           
  }

  postMessage(message: Message): Observable<any> {
    return this.http.post<any>(`${this.url}/sendmessage`, message);
  }

  getMessages(userId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.url}/${userId}`);
  }

 
  sendMessageThroughSignalR(message: Message) {
    this.hubConnection.invoke('SendMessage', message.senderId, message.receiverId, message.content)
      .catch(err => {
        console.error('SignalR üzerinden mesaj gönderme hatası: ', err);
      });
  }
  
}
