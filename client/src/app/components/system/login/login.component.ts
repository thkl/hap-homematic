/*
 * **************************************************************
 * File: login.component.ts
 * Project: client
 * File Created: Monday, 4th October 2021 2:32:12 pm
 * Author: Thomas Kluge (th.kluge@me.com>)
 * -----
 * Last Modified: Monday, 4th October 2021 7:22:28 pm
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
import { ActivatedRoute, Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { AccountService } from 'src/app/service/account.service';
import { ApplicationService } from 'src/app/service/application.service';
import * as Utility from 'src/app/service/utility';

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
    private accountService: AccountService,
    private logger: NGXLogger,
  ) {

  }

  ngOnInit(): void {

    const sid = Utility.getQueryVariable('sid');
    if (sid) {
      this.logger.debug('AppComponent::SID found');
      this.application.setToken(sid);
    }


    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/devices';
    if (this.accountService.needsAuthentication === false) {
      this.router.navigateByUrl(returnUrl);
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
