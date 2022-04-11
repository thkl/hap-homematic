/*
 * **************************************************************
 * File: restart.component.ts
 * Project: client
 * File Created: Monday, 27th September 2021 11:28:47 am
 * Author: Thomas Kluge (th.kluge@me.com>)
 * -----
 * Last Modified: Sunday, 10th October 2021 4:22:17 pm
 * Modified By: Thomas Kluge (th.kluge@me.com>)
 * -----
 * Copyright 2020 - 2021 @thkl / github.com/thkl
 * -----
 * **************************************************************
 * MIT License
 *
 * Copyright (c) 2021 github.com/thkl
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * **************************************************************
 */

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
import { ApplicationService } from 'src/app/service/application.service';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { Actions, Models } from 'src/app/store';
import { AbstractDataComponent } from '../../abstractdatacomponent/abstractdatacomponent.component';

@Component({
  selector: 'app-restart',
  templateUrl: './restart.component.html',
  styleUrls: ['./restart.component.sass']
})
export class RestartComponent extends AbstractDataComponent implements OnInit {

  isRestarting = false;
  enableDebug: boolean;

  constructor(
    private applicationService: ApplicationService,
    public store: Store<Models.AppState>,
    private configService: SystemconfigService,
    private logger: NGXLogger,
    private router: Router
  ) {
    super();
  }


  ngOnInit(): void {
    // Subscribe to the global Restart Indicator
    this.addSubscription(this.applicationService.restartIndicator().subscribe(() => {
      this.isRestarting = false;
      this.store.dispatch(Actions.LoadSystemConfigAction());
      this.router.navigate(['/']);
    }));
  }


  downloadLog(): void {
    this.logger.debug(`RestartComponent::downloadLog`);
    window.open(`${this.applicationService.getApiURL()}/log/download`);
  }

  doReboot(): void {
    this.logger.debug(`RestartComponent::doReboot`);
    this.configService.doReboot(this.enableDebug).subscribe(() => {
      this.logger.debug(`RestartComponent::doReboot initiated`);
      this.isRestarting = true;
    })
  }
}
