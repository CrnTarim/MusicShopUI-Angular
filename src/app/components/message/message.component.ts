
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
  message: string = '';  
  targetConnectionId: string = '';  
  receivedMessages: string[] = []; 

  constructor(private messagesService: MessagesService) { }

  ngOnInit(): void {
   
    this.messagesService.message$.subscribe(message => {
      if (message) {
        this.receivedMessages.push(message);  
      }
    });
  }

  // Hedef kullanıcıya mesaj gönder
  sendMessage(): void {
    if (this.targetConnectionId && this.message.trim()) {
      this.messagesService.sendMessageToUser(this.targetConnectionId, this.message);
      this.message = ''; 
    }
  }
}