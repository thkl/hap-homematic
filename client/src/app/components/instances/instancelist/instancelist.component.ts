import { Component, ElementRef, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Store } from '@ngrx/store';
import { fromEvent, merge, Observable, Subject } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { filterObjects, sortObject } from 'src/app/service/utility';
import { Models } from 'src/app/store';

@Component({
  selector: 'app-instancelist',
  templateUrl: './instancelist.component.html',
  styleUrls: ['./instancelist.component.sass']
})
export class InstancelistComponent implements OnInit {

  private hapInstances!: Observable<Models.HapInstance[]>;

  displayedColumns: string[] = ['displayName', 'port', 'room', 'pincode', 'control'];
  dataSource: MatTableDataSource<Models.HapInstance> = new MatTableDataSource([]);
  searchChanged: EventEmitter<number> = new EventEmitter();
  sortChanged: Subject<any> = new Subject();
  sortDir: string = 'asc';
  sortField: string = 'name';
  noData: boolean = false;

  public searchText: string = '';
  @ViewChild('searchInput') input: ElementRef;

  constructor(private store: Store<Models.AppState>) { }

  ngOnInit(): void {
    this.hapInstances = this.store.select((store) => store.hapInstances.list);
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
          return this.hapInstances;
        }),
        map((items) =>
          items.filter((item) =>
            filterObjects(item, this.searchText, ['displayName'])
          )
        ),
        map((items) =>
          items.sort((a, b) => sortObject(a, b, this.sortField, this.sortDir))
        )
      )
      .subscribe((list) => {
        this.dataSource = new MatTableDataSource(list);
      });
  }

  sortData(event: any) {
    this.sortDir = event.direction;
    this.sortField = event.active;
    this.sortChanged.next();
  }

}
