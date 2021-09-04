import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';


@Component({
  selector: 'dropdownmenu',
  templateUrl: './dropdownmenu.component.html',
  styleUrls: ['./dropdownmenu.component.sass']
})
export class DropdownmenuComponent implements OnInit {

  private _dataSource: Observable<any[]>;
  private _selected: any;

  @Input() set dataSource(newDs: Observable<any[]>) {
    this._dataSource = newDs;
    this._select(this.selected);
  }

  get dataSource(): Observable<any[]> {
    return this._dataSource;
  }

  @Input() set selected(newSel: any) {
    this._selected = newSel;
    this._select(this._selected);
  }

  get selected(): any {
    return this._selected;
  }


  @Input() id: string;
  @Input() keyLabel: string;
  @Input() keyId: string;
  @Output() selectedChanged = new EventEmitter();

  public selectedLabel: string;

  constructor() { }

  ngOnInit(): void {
    this._select(this.selected);
  }

  _select(newId: number) {
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
