import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NGXLogger, NgxLoggerLevel } from 'ngx-logger';


@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.sass']
})
export class MenuComponent {

  public currentRouteUrl: string;
  public currentSubMenu: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.router.events.subscribe((event) => {

      if (event instanceof NavigationEnd) {
        this.currentRouteUrl = event.url.split('/')[1];
      }

    });
  }


  toggleSubMenu(menu: string): void {

    if (this.currentSubMenu === menu) {
      this.currentSubMenu = '';
    } else {
      this.currentSubMenu = menu;
    }
  }

}
