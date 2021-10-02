import { HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { SystemconfigService } from 'src/app/service/systemconfig.service';

@Component({
  selector: 'app-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.sass']
})
export class BackupComponent implements OnInit {

  fileName = '';

  constructor(
    private systemconfigService: SystemconfigService
  ) { }

  ngOnInit(): void {
  }


  onFileSelected(event) {

    const file: File = event.target.files[0];

    if (file) {
      this.fileName = file.name;
      const formData = new FormData();
      formData.append("thumbnail", file);
      this.systemconfigService.doRestore(formData).subscribe(upload => {
        console.log(upload);
      });
    }
  }

  getFileName(response: HttpResponse<Blob>) {
    let filename: string;
    try {
      const contentDisposition: string = response.headers.get('content-disposition');
      const r = /(?:filename=")(.+)(?:;")/
      filename = r.exec(contentDisposition)[1];
    }
    catch (e) {
      filename = 'backup.tar.gz'
    }
    return filename
  }

  createBackup() {
    this.systemconfigService.doBackup().subscribe((response: HttpResponse<Blob>) => {
      const filename = this.getFileName(response)
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
