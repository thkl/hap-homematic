import { Component, OnInit } from '@angular/core';
import { MessageService, ToastMessage } from 'src/app/service/message.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.sass']
})
export class ToastComponent implements OnInit {

  messageList: ToastMessage[] = [];

  constructor(
    private messageService: MessageService
  ) {

  }

  ngOnInit(): void {
    this.messageService.changed.subscribe(messagelist => {
      this.messageList = messagelist;
    })
  }

}
