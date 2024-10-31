import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Message } from '../../models/message';
import { MessagesService } from '../../services/messages.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrl: './message.component.css'
})
export class MessageComponent implements OnInit {
  messages: Message[] = [];
  newMessage: string = '';
  senderId: string = '';
  receiverId: string = '263bf8e5-1a5f-42ec-8a2b-1e0ee171141b'; 

  constructor(private messagesService: MessagesService,private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    
    this.senderId = localStorage.getItem('userId') || '';

   
    this.messagesService.getMessages(this.senderId).subscribe(contents => {
      contents.forEach(content => {
        this.messages.push({
          senderId: this.senderId,
          receiverId: this.receiverId,
          content
        });
      });
    });

  
    this.messagesService.messageReceived$.subscribe(message => {
      console.log('Yeni gelen mesaj:', message);
      const newMessage: Message = {
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content
      };
      this.messages.push(newMessage);
      this.cdr.detectChanges(); // Değişiklikleri algıla
  });
    
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      const message: Message = {
        senderId: this.senderId,
        receiverId: this.receiverId,
        content: this.newMessage
      };
  
      this.messagesService.postMessage(message).subscribe(response => {
        console.log('API üzerinden mesaj gönderildi:', response.message);
        this.messagesService.sendMessageThroughSignalR(message);
      }, error => {
        console.error('Mesaj gönderiminde hata:', error);
      });
  
      this.newMessage = '';
    }
  }
}
