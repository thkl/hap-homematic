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
