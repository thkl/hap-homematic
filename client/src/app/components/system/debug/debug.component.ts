import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.sass']
})
export class DebugComponent {

  activeComponent: string;

  constructor(public activeRoute: ActivatedRoute) {
    activeRoute.url.subscribe(() => {
      // WTF ... but here we are
      this.activeComponent = activeRoute.snapshot.firstChild.routeConfig.component.name;
    });
  }

}
