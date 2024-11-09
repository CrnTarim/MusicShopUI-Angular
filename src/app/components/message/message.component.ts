
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
  targetUserId: string = '';  
  message: string = '';       
  receivedMessages: string[] = [];  
  connected: boolean = false; 

  constructor(private messagesService: MessagesService) {
    
    this.messagesService.message$.subscribe(message => {
      this.receivedMessages.push(message); 
    });

    this.connect();
  }

  connect(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.messagesService.startConnection(userId);
      this.connected = true;
    }
  }

  sendMessage(): void {
    if (this.targetUserId && this.message.trim()) {
      this.messagesService.sendMessageToUser(this.targetUserId, this.message);
      this.message = '';  
    }
  }
}