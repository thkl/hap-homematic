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
