
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Message } from '../../models/message';
import { MessagesService } from '../../services/messages.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrl: './message.component.css'
})
export class MessageComponent  {
   userId: string = '';       // Kullanıcının kimliğini temsil eden ID
  targetUserId: string = '';  // Mesaj gönderilecek kullanıcının ID'si
  message: string = '';       // Gönderilecek mesaj
  receivedMessage: string = '';// Gelen mesajları göstermek için
  connected: boolean = false; // Kullanıcının bağlantı durumu

  constructor(private messagesService: MessagesService) {
    // Mesaj geldiğinde receivedMessage değişkenini günceller
    this.messagesService.message$.subscribe(message => {
      this.receivedMessage = message;
    });
  }

  connect(): void {
    if (this.userId) {
      this.messagesService.startConnection(this.userId);
      this.connected = true;
    }
  }

  sendMessage(): void {
    if (this.targetUserId && this.message.trim()) {
      this.messagesService.sendMessageToUser(this.targetUserId, this.message);
      this.message = '';  // Mesaj kutusunu temizle
    }
  }
}