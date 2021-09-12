
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.sass']
})
export class ConfirmationDialogComponent implements OnInit {

  @Input() selectedObject: any;
  @Input() title: string;
  @Input() dialogId: string;
  @Input() confirmText: string;

  @Output() confirm: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  doConfirm(): void {
    this.confirm.emit();
  }
}
