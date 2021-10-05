/*
 * **************************************************************
 * File: account.service.ts
 * Project: client
 * File Created: Monday, 4th October 2021 2:32:12 pm
 * Author: Thomas Kluge (th.kluge@me.com>)
 * -----
 * Last Modified: Monday, 4th October 2021 7:22:40 pm
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

import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";


@Injectable({ providedIn: 'root' })
export class AccountService {

  private loginSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private _sid; // we have to set a dummy and react at the first 401
  private _needsAuthentication = true;

  public get sid(): string {
    if (this._needsAuthentication === false) {
      return 'x';
    }
    return this._sid
  }

  public get needsAuthentication(): boolean {
    return this._needsAuthentication;
  }

  public set needsAuthentication(na: boolean) {
    if (this._needsAuthentication !== na) {
      this._needsAuthentication = na;
      this.loginSubject.next(!na);
    }
  }

  public authenticate(newSid: string): void {
    this._sid = newSid;
    this.loginSubject.next(true);
  }

  public logout(): void {
    this._sid = undefined;
    this.loginSubject.next(false);
  }

  subscribe(): Observable<any> {
    return this.loginSubject.asObservable();
  }

}
