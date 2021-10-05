import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  type: string,
  title: string,
  message: string,
  isVisible?: boolean
}


@Injectable({
  providedIn: 'root'
})
export class MessageService {

  private messageList: ToastMessage[] = []
  public changed: Subject<ToastMessage[]> = new Subject();

  constructor() {
    setInterval(() => {
      // cleanup
      this.messageList = this.messageList.filter(message => message.isVisible === true)
    }, 1000)
  }

  showMessage(message: ToastMessage, forTime: number) {
    message.isVisible = true;
    this.messageList.push(message);
    this.changed.next(this.messageList);
    if (forTime > 0) {
      setTimeout(() => {
        message.isVisible = false
        this.changed.next(this.messageList);
      }, forTime * 1000);
    }
  }
}
