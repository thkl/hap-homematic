import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from 'src/app/service/account.service';
import { ApplicationService } from 'src/app/service/application.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {

  username: string;
  password: string

  constructor(
    private application: ApplicationService,
    private router: Router,
    private route: ActivatedRoute,
    private accountService: AccountService
  ) {
    console.log('Login')
  }
  ngOnInit(): void {
    if (this.accountService.needsAuthentication === false) {
      this.router.navigateByUrl('/');
    }
  }


  doLogin(): void {
    this.application.loginToCCU(this.username, this.password).subscribe(result => {
      if ((result) && (result.token)) {
        this.application.setToken(result.token);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      }
    })
  }
}
