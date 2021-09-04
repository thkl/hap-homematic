import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Models, Selectors } from 'src/app/store';
import { HapAppliance } from 'src/app/store/models';

@Component({
  selector: 'app-editappliance',
  templateUrl: './editappliance.component.html',
  styleUrls: ['./editappliance.component.sass']
})
export class EditApplianceComponent implements OnInit {

  selectedAppliance: HapAppliance;

  constructor(private route: ActivatedRoute, public store: Store<Models.AppState>) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.store.pipe(select(Selectors.selectDeviceById(id))).subscribe(appliance => {
        if (appliance !== undefined) {
          this.selectedAppliance = appliance;
        }
      })
    })
  }

}
