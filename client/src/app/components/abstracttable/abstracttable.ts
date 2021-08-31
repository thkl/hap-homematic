import { Component, ElementRef, EventEmitter, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { select, Store } from "@ngrx/store";
import { fromEvent, merge, Observable, Subject, Subscription } from "rxjs";
import { map, startWith, switchMap } from "rxjs/operators";
import { filterObjects, sortObject } from "src/app/service/utility";
import { Models } from "src/app/store";

@Component({
  selector: 'app-abstracttable',
  template: '',
  styleUrls: [],
})

export class AbstractTableComponent implements OnInit {

  private _displayedColumns: string[];
  private _dataSource: Observable<Models.HapAppliance[]>;
  private _loadingSelector: any;
  private _searchFields: string[] = [];
  public dataSourceFlt: MatTableDataSource<Models.HapAppliance> =
    new MatTableDataSource([]);

  private searchChanged: EventEmitter<number> = new EventEmitter();
  private sortChanged: Subject<any> = new Subject();
  private sortDir: string = 'asc';
  private sortField: string = 'name';

  public loading: boolean;
  private subscription: Subscription = new Subscription();
  public noData: boolean = false;

  public searchText: string = '';

  @ViewChild('searchInput') input: ElementRef;

  constructor(public store: Store<Models.AppState>) { }

  ngOnInit(): void {

    if (this._loadingSelector === undefined) {
      throw new Error('loadingSelector not set');
    }

    if (this._dataSource === undefined) {
      throw new Error('dataSource Selector not set not set');
    }

    if (this._displayedColumns === undefined) {
      throw new Error('display Columns not set');
    }

    this.subscription.add(
      this.store.pipe(select(this._loadingSelector)).subscribe((loading) => {
        this.loading = loading;
      })
    );
  }

  set dataSource(ds: Observable<Models.HapAppliance[]>) {
    this._dataSource = ds;
  }

  set loadingSelector(sl: any) {
    this._loadingSelector = sl;
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

  ngAfterViewInit() {
    fromEvent(this.input.nativeElement, 'keyup').subscribe(() => {
      this.searchChanged.emit(0);
    });
  }

  ngAfterContentChecked() {
    merge(this.searchChanged, this.sortChanged)
      .pipe(
        startWith({}),
        switchMap(() => {
          return this._dataSource;
        }),
        map((items) =>
          items.filter((item) =>
            filterObjects(item, this.searchText, this._searchFields)
          )
        ),

        map((items) =>
          items.sort((a, b) => sortObject(a, b, this.sortField, this.sortDir))
        )
      )
      .subscribe((list) => {
        this.dataSourceFlt = new MatTableDataSource(list);
        this.noData = this.dataSourceFlt.data.length === 0;
      });
  }

  sortData(event: any) {
    this.sortDir = event.direction;
    this.sortField = event.active;
    this.sortChanged.next();
  }
}
