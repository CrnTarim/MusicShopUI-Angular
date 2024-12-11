import { MessagepostService } from './../../services/messagepost.service';

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

  constructor(private messagesService: MessagesService,private messagepost:MessagepostService) {
    
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
      this.saveMessage();
      this.message = '';  
    }
  }

  saveMessage(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const messageToSend: Message = {
      senderId: userId,
      receiverId: this.targetUserId,
      content: this.message,
      timestamp: new Date()
    };

    this.messagepost.postMessage(messageToSend).subscribe({
      next: () => console.log('Message saved successfully'),
      error: (err) => console.error('Error saving message:', err)
    });
  }
}