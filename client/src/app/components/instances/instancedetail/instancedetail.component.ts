import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Actions, Models, Selectors } from 'src/app/store';
import { HapInstance, CCURoom } from 'src/app/store/models';

@Component({
  selector: 'app-instancedetail',
  templateUrl: './instancedetail.component.html',
  styleUrls: ['./instancedetail.component.sass']
})
export class InstancedetailComponent implements OnInit {

  selectedInstance: HapInstance;
  title = 'Edit instance %s';
  errorMessage = undefined;
  roomList: Observable<CCURoom[]>;
  public iconPin: string;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public store: Store<Models.AppState>) { }

  ngOnInit(): void {

    this.roomList = this.store.pipe(select(Selectors.selectAllRooms))

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id !== undefined) {
        this.store.pipe(select(Selectors.selectInstancesById(id))).subscribe(instance => {
          if (instance !== undefined) {
            this.selectedInstance = JSON.parse(JSON.stringify(instance));
            if (this.selectedInstance) {
              this.iconPin = this.selectedInstance.pincode.replace(/-/g, '')
              if (this.selectedInstance.hasPublishedDevices === true) {
                this.selectedInstance.publishDevices = true;
              }
            }
          }
        })
      }
    });

    this.route.url.subscribe(url => {
      if ((url.length > 1) && (url[1].path === 'new')) {
        this.title = 'New Instance';
        this.selectedInstance = { id: 'new', user: '', displayName: '', roomId: 0, canDelete: true }
      }
    })

  }

  rebuildInstanceName(displayName: string): string {
    if (displayName.indexOf('HomeMatic') !== -1) {
      return displayName.substr(10);
    }
    return displayName;
  }

  setInstanceName(dta: any): void {
    this.selectedInstance.displayName = dta.value;
  }

  selectRoom(roomObject: CCURoom) {
    this.selectedInstance.roomId = roomObject.id;
    if ((this.selectedInstance.displayName === undefined) || (this.selectedInstance.displayName === '')) {
      this.selectedInstance.displayName = roomObject.name;
    }
  }

  validate(): boolean {
    // Check if we have a name
    if ((this.selectedInstance.displayName === undefined) || (this.selectedInstance.displayName.length === 0)) {
      this.errorMessage = 'Instance must have a name';
      return false;
    }
    this.errorMessage = undefined;
    return true;
  }

  doSave(): void {
    if (this.validate() === true) {
      this.store.dispatch({ type: Actions.HapInstanceActionTypes.SAVE_INSTANCE_TO_API, payload: [this.selectedInstance] });
      this.router.navigate(['/instances']);
    }
  }
}
