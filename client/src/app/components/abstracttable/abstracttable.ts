import { Component, ElementRef, EventEmitter, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { select, Store } from "@ngrx/store";
import { fromEvent, merge, Observable, Subject, Subscription } from "rxjs";
import { map, startWith, switchMap } from "rxjs/operators";
import { filterObjects, sortObject } from "src/app/service/utility";
import { Models } from "src/app/store";
import { PaginationComponent } from "../util/pagination/pagination.component";

@Component({
  selector: 'app-abstracttable',
  template: ' '
})

export class AbstractTableComponent implements OnInit {

  private _displayedColumns: string[];
  private _dataSource: Observable<Models.HapAppliance[]>;
  private _loadingSelector: any;
  private _dataSourceSelector: any;
  private _searchFields: string[] = [];
  private _maxRecords: number = 10;
  public dataSourceFlt: MatTableDataSource<any> = new MatTableDataSource([]);
  public recordCount: number;

  private _selectedObject: any;
  private searchChanged: EventEmitter<number> = new EventEmitter();
  public pageChanged: EventEmitter<number> = new EventEmitter();

  private sortChanged: Subject<any> = new Subject();
  private sortDir: string = 'asc';
  private sortField: string = 'name';
  private initialized = false;

  public loading: boolean;
  private subscription: Subscription = new Subscription();
  public noData: boolean = false;

  public searchText: string = '';

  @ViewChild('searchInput') input: ElementRef;
  @ViewChild(PaginationComponent) paginator: PaginationComponent;

  constructor(public store: Store<Models.AppState>) { }

  ngOnInit(): void {

    if (this._loadingSelector === undefined) {
      throw new Error('loadingSelector not set');
    }

    if (this._dataSourceSelector === undefined) {
      throw new Error('dataSource Selector not set not set');
    }

    if (this._displayedColumns === undefined) {
      throw new Error('display Columns not set');
    }

    this._dataSource = this.store.pipe(select(this._dataSourceSelector));

    this.subscription.add(
      this.store.pipe(select(this._loadingSelector)).subscribe((loading) => {
        this.loading = loading;
      })
    );
  }

  set dataSourceSelector(sl: any) {
    this._dataSourceSelector = sl;
  }
  set loadingSelector(sl: any) {
    this._loadingSelector = sl;
  }

  getDataSource(): Observable<any> {
    return this._dataSource
  }

  hasSearchOption(): boolean {
    return (this._searchFields.length > 0);
  }

  get displayedColumns(): string[] {
    return this._displayedColumns;
  }

  set displayedColumns(columns: string[]) {
    this._displayedColumns = columns;
  }

  set searchFields(fld: string[]) {
    this._searchFields = fld;
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    if (this.hasSearchOption() === true) {
      fromEvent(this.input.nativeElement, 'keyup').subscribe(() => {
        console.log('search changed')
        this.searchChanged.emit(0);
      });
    }
  }

  ngAfterContentChecked(): void {
    merge(this.searchChanged, this.sortChanged, this.pageChanged)
      .pipe(
        startWith({}),
        switchMap(() => {
          return this.getDataSource();
        }),
        map((items) =>
          items.filter((item) =>
            filterObjects(item, this.searchText, this._searchFields)
          )
        ),
        map((items) =>
          items.sort((a, b) => sortObject(a, b, this.sortField, this.sortDir))
        ),
        map((items) =>
          (this.paginator !== undefined) ? this.paginator.paginate(items) : items
        )
      )
      .subscribe((list: any[]) => {
        this.dataSourceFlt = new MatTableDataSource(list);
        this.recordCount = this.dataSourceFlt.data.length;
        this.noData = this.dataSourceFlt.data.length === 0;
      });
  }

  sortData(event: any): void {
    this.sortDir = event.direction;
    this.sortField = event.active;
    this.sortChanged.next();
  }

  selectObject(obj: any): void {
    this._selectedObject = obj;
  }

  get selectedObject(): any {
    return this._selectedObject;
  }

}
