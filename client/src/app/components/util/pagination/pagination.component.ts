import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.sass']
})
export class PaginationComponent implements OnInit {

  private _maxRecords: number;
  private _currentRecord: number;
  private _numRecords: number;
  private _maxPages: number = 5;

  @Output() pageChanged: EventEmitter<number> = new EventEmitter();

  @Input() set maxRecords(max: number) {
    this._maxRecords = max;
    this.build();
  }

  get maxRecords(): number {
    return this._maxRecords;
  }

  @Input() set currentRecord(cur: number) {
    this._currentRecord = cur;
    this.build();
  }

  get currentRecord(): number {
    return this._currentRecord;
  }

  @Input() set numRecords(num: number) {
    this._numRecords = num;
    this.build();
  }

  get numRecords(): number {
    return this._numRecords;
  }

  currentPage: number = 1;
  currentStart: number = 1;
  pages: number = 1;

  constructor() { }

  ngOnInit(): void {

  }

  nextDisabled(): boolean {
    if ((this.pages < this._maxPages) || ((this.currentStart + this._maxPages) > this.pages)) {
      return true;
    }
    return false;
  }

  prevDisabled(): boolean {
    if ((this.currentStart === 1) || (this.currentPage === 1)) {
      return true;
    }
    return false;
  }

  pageNumber(position: number): number {
    return (this.currentStart + position);
  }

  setPage(position: number) {
    this.currentPage = this.currentStart + position;
    this.pageChanged.emit(this.currentPage);
  }

  switchNextPage() {
    if (this.currentStart + this._maxPages <= this.pages) {
      this.currentStart = this.currentStart + 1;
      this.rebuildIndicator();
    }
  }

  switchPrevPage() {
    if (this.currentStart > 1) {
      this.currentStart = this.currentStart - 1;
      this.rebuildIndicator();
    }
  }

  rebuildIndicator() {
    // check if the indicator is visible
    // first check if we run out left wise
    if (this.currentPage < this.currentStart) {
      this.currentPage = this.currentStart;
    }
    // check if we run out on the right side
    if (this.currentPage >= (this.currentStart + this._maxPages)) {
      this.currentPage = (this.currentStart + this._maxPages) - 1
    }
  }

  build(): void {
    this.pages = Math.ceil(parseFloat(this.numRecords.toFixed(2)) / parseFloat(this.maxRecords.toFixed(2))); // well
  }

  createRange(number: number) {
    if (number > this._maxPages) {
      return new Array(this._maxPages);
    } else {
      return new Array(number);
    }
  }

  reset() {
    this.currentPage = 1;
  }

  paginate(items: any[]): any[] {
    this.numRecords = items.length;
    let result: any[] = [];
    const start = (this.currentPage - 1) * this._maxRecords;
    const end = start + this._maxRecords;
    let i: number;
    for (i = start; i < end; i++) {
      if (items.length > i) {
        result.push(items[i]);
      }
    }
    return result;
  }



}
