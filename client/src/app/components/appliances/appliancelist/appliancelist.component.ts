import {
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
import { filterObjects, sortObject } from 'src/app/service/utility';
import { Models, Selectors } from 'src/app/store'


@Component({
  selector: 'app-appliancelist',
  templateUrl: './appliancelist.component.html',
  styleUrls: ['./appliancelist.component.sass'],
})
export class AppliancelistComponent implements OnInit {
  public displayedColumns: string[] = [
    'serial',
    'name',
    'serviceClass',
    'instanceID',
    'control',
  ];

  private dataSourceAll: Observable<Models.HapAppliance[]>;
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

  constructor(private store: Store<Models.AppState>) { }

  ngOnInit(): void {
    this.dataSourceAll = this.store.pipe(select(Selectors.selectAllDevices));

    this.subscription.add(
      this.store.pipe(select(Selectors.deviceLoading)).subscribe((loading) => {
        this.loading = loading;
      })
    );
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
          return this.dataSourceAll;
        }),
        map((items) =>
          items.filter((item) =>
            filterObjects(item, this.searchText, ['name', 'serial'])
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
