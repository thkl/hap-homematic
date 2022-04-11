/*
 * **************************************************************
 * File: backup.component.ts
 * Project: client
 * File Created: Saturday, 2nd October 2021 8:26:41 pm
 * Author: Thomas Kluge (th.kluge@me.com>)
 * -----
 * Last Modified: Sunday, 10th October 2021 4:22:39 pm
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

import { HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import { Actions, Models } from 'src/app/store';
import { AbstractDataComponent } from '../../abstractdatacomponent/abstractdatacomponent.component';
import * as Util from 'src/app/service/utility';
import { ApplicationService } from 'src/app/service/application.service';

@Component({
  selector: 'app-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.sass']
})
export class BackupComponent extends AbstractDataComponent implements OnInit {

  fileName = '';
  file: File;
  isRestarting = false;

  constructor(
    private systemconfigService: SystemconfigService,
    public store: Store<Models.AppState>,
    private logger: NGXLogger,
    private router: Router,
    private applicationService: ApplicationService
  ) {
    super();
  }

  ngOnInit(): void {
    this.addSubscription(this.applicationService.restartIndicator().subscribe(() => {
      this.logger.debug(`BackupComponent::rebooting completed`);
      this.isRestarting = false;
      this.store.dispatch(Actions.LoadSystemConfigAction());
      this.store.dispatch(Actions.LoadHapInstanceAction());
      this.store.dispatch(Actions.LoadHapAppliancesAction());
      this.router.navigate(['/']);
    }));
  }

  onSelectFile(event) {
    this.file = event.target.files[0];
    if (this.file) {
      this.fileName = this.file.name;
    }
  }


  restore() {
    if (this.file) {
      const formData = new FormData();
      formData.append("backupdata", this.file, 'backup.tar.gz');
      this.systemconfigService.doRestore(formData).subscribe(result => {
        if (result['result'] === 'ok') {
          this.isRestarting = true;
        }
      });
    }
  }

  createBackup() {
    this.systemconfigService.doBackup().subscribe((response: HttpResponse<Blob>) => {
      const filename = Util.getFileName(response, 'backup.tar.gz');
      const binaryData = [];
      binaryData.push(response.body);
      const downloadLink = document.createElement('a');
      downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, { type: 'blob' }));
      downloadLink.setAttribute('download', filename);
      document.body.appendChild(downloadLink);
      downloadLink.click();
    })
  }

}
