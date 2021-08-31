import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { select, Store } from '@ngrx/store';
import { fromEvent, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { sortObject } from 'src/app/service/utility';
import { AppState } from 'src/app/store/models/app-state.model';
import { HapAppliance } from 'src/app/store/models/HapAppliance.model';
import { variablesLoading } from 'src/app/store/selectors/HapVariable.selector';

@Component({
  selector: 'app-variablelist',
  templateUrl: './variablelist.component.html',
  styleUrls: ['./variablelist.component.sass'],
})
export class VariablelistComponent implements OnInit, AfterViewInit {
  public displayedColumns: string[] = [
    'nameInCCU',
    'name',
    'serviceClass',
    'instanceID',
    'control',
  ];

  private dataSourceAll: Observable<HapAppliance[]>;
  public dataSourceFlt: MatTableDataSource<HapAppliance> =
    new MatTableDataSource([]);
  public noData: boolean;
  private searchChanged: EventEmitter<number> = new EventEmitter();
  private sortChanged: Subject<any> = new Subject();
  private sortDir: string = 'asc';
  private sortField: string = 'name';

  public loading: boolean = false;
  private subscription: Subscription = new Subscription();

  public searchText: string = '';

  @ViewChild('searchInput') input: ElementRef;

  constructor(private store: Store<AppState>) { }

  ngOnInit(): void {
    this.dataSourceAll = this.store.select((store) => store.hapVariables.list);

    this.subscription.add(
      this.store.pipe(select(variablesLoading)).subscribe((loading) => {
        this.loading = loading;
      })
    );
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // this event emitter from observable is strange but:
  // changing noData while AfterViewInit will end up in a  error
  // we do need the searchChanged to be set .. but at AfterContentChecked there is no ViewChild
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
          return this.dataSourceAll;
        }),
        map((items) =>
          items.filter(
            (item) =>
              item.name.indexOf(this.searchText) > -1 ||
              item.serial.indexOf(this.searchText) > -1
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
