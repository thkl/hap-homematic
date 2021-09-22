
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.sass']
})
export class ConfirmationDialogComponent {

  @Input() selectedObject: any;
  @Input() title: string;
  @Input() dialogId: string;
  @Input() confirmText: string;
  @Input() dialogType: string;
  @Input() img: string;

  @Output() confirm: EventEmitter<any> = new EventEmitter();

  doConfirm(): void {
    this.confirm.emit();
  }
}
