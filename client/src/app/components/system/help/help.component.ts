import { HttpResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { SystemconfigService } from 'src/app/service/systemconfig.service';
import * as Util from 'src/app/service/utility';


@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.sass']
})
export class HelpComponent {

  supportDeviceAddress: string;

  constructor(
    private systemconfigService: SystemconfigService
  ) { }


  createHelpFile() {
    if ((this.supportDeviceAddress) && (this.supportDeviceAddress !== '')) {
      this.systemconfigService.doGetSupportData(this.supportDeviceAddress).subscribe((response: HttpResponse<Blob>) => {
        const filename = Util.getFileName(response, 'device.json');
        const binaryData = [];
        binaryData.push(response.body);
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, { type: 'blob' }));
        downloadLink.setAttribute('download', filename);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        this.supportDeviceAddress = '';
      });
    }
  }


}
