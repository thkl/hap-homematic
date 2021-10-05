import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { MessageService } from 'src/app/service/message.service';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { Models, Selectors } from 'src/app/store';
import { AbstractDataComponent } from '../../abstractdatacomponent/abstractdatacomponent.component';



@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.sass']
})
export class MenuComponent extends AbstractDataComponent implements OnInit {

  public currentRouteUrl: string;
  public currentSubMenu: string;
  public isNew: boolean;

  constructor(
    private router: Router,
    private store: Store<Models.AppState>,
    private messageService: MessageService,
    private systemconfigService: SystemconfigService
  ) {
    super();
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRouteUrl = event.url.split('/')[1];
      }
    });
  }

  ngOnInit(): void {
    this.addSubscription(
      this.store.pipe(select(Selectors.configData)).subscribe(cfg => {
        if ((cfg !== undefined) && (cfg.version !== undefined)) {
          this.isNew = (cfg.isEmpty !== undefined) ? cfg.isEmpty : true;
        }
      })
    )
  }


  toggleSubMenu(menu: string): void {
    if (this.currentSubMenu === menu) {
      this.currentSubMenu = '';
    } else {
      this.currentSubMenu = menu;
    }
  }

  updateCache() {
    this.systemconfigService.doRefreshCache().subscribe(() => {
      this.messageService.showMessage({ title: "Update", type: "info", message: "Cache updated ..." }, 5);
    });
  }
}
