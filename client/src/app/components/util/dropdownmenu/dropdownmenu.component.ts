import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';


@Component({
  selector: 'dropdownmenu',
  templateUrl: './dropdownmenu.component.html',
  styleUrls: ['./dropdownmenu.component.sass']
})
export class DropdownmenuComponent implements OnInit {

  @Input() dataSource: Observable<any[]>;
  @Input() id: string;
  @Input() keyLabel: string;
  @Input() keyId: string;
  @Input() selected: any;
  @Output() selectedChanged = new EventEmitter();

  public selectedLabel: string;

  constructor() { }

  ngOnInit(): void {
    this._selected(this.selected);
  }

  _selected(newId: number) {
    this.dataSource.pipe(map(items => items.filter(item => item[this.keyId] === newId))
    ).subscribe(fItem => {
      if (fItem.length > 0) {
        this.selectedLabel = fItem[0][this.keyLabel];
        this.selectedChanged.next(fItem);
      } else {
        this.selectedLabel = undefined;
      }
    })
  }
}
