import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  ViewChild,
} from '@angular/core';
import { select, Store } from '@ngrx/store';
import { merge, Observable, fromEvent, Subject } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { Models, Selectors } from 'src/app/store';
import { MatTableDataSource } from '@angular/material/table';
import { sortObject } from 'src/app/service/utility';

@Component({
  selector: 'app-programlist',
  templateUrl: './programlist.component.html',
  styleUrls: ['./programlist.component.sass'],
})
export class ProgramlistComponent implements OnInit, AfterViewInit {
  private hapPrograms!: Observable<Models.HapAppliance[]>;

  displayedColumns: string[] = ['nameInCCU', 'name', 'instanceID', 'control'];
  dataSource: MatTableDataSource<Models.HapAppliance> = new MatTableDataSource([]);
  searchChanged: EventEmitter<number> = new EventEmitter();
  sortChanged: Subject<any> = new Subject();
  sortDir: string = 'asc';
  sortField: string = 'name';

  public searchText: string = '';
  @ViewChild('searchInput') input: ElementRef;

  constructor(private store: Store<Models.AppState>) { }

  ngOnInit(): void {
    this.hapPrograms = this.store.pipe(select(Selectors.selectAllPrograms));
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
          return this.hapPrograms;
        }),
        map((items) =>
          items.filter((item) => item.name.indexOf(this.searchText) > -1)
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
