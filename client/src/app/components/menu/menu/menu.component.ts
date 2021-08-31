import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Data, NavigationEnd, NavigationError, NavigationStart, Params, Router } from '@angular/router';
import { combineLatest, Observable, Subscription } from 'rxjs';


@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.sass']
})
export class MenuComponent implements OnInit {

  public currentRouteUrl: string;
  public currentSubMenu: string;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.router.events.subscribe((event) => {

      if (event instanceof NavigationEnd) {
        this.currentRouteUrl = event.url.split('/')[1];
      }

    });
  }

  ngOnInit(): void {
  }

  toggleSubMenu(menu: string): void {

    if (this.currentSubMenu === menu) {
      this.currentSubMenu = '';
    } else {
      this.currentSubMenu = menu;
    }
  }
}
