import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Models, Selectors } from 'src/app/store';
import { HapInstance, HapRoom } from 'src/app/store/models';

@Component({
  selector: 'app-instancedetail',
  templateUrl: './instancedetail.component.html',
  styleUrls: ['./instancedetail.component.sass']
})
export class InstancedetailComponent implements OnInit {

  selectedInstance: HapInstance;
  roomList: Observable<HapRoom[]>;
  public iconPin: string;
  constructor(private route: ActivatedRoute, public store: Store<Models.AppState>) { }

  ngOnInit(): void {

    this.roomList = this.store.pipe(select(Selectors.selectAllRooms))

    this.route.params.subscribe(params => {
      const id = params['id'];
      this.store.pipe(select(Selectors.selectInstancesById(id))).subscribe(instance => {
        this.selectedInstance = instance;
        if (this.selectedInstance) {
          this.iconPin = this.selectedInstance.pincode.replace(/-/g, '')
        }
      })
    });

  }

  selectRoom($event) {
    console.log($event);
  }
}
