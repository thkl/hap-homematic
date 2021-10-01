import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-adc',
  template: ''
})
export class AbstractDataComponent implements OnDestroy {

  private subscription: Subscription = new Subscription();


  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  addSubscription(newSubscription: Subscription): void {
    this.subscription.add(newSubscription);
  }

  unsubscribeAll(): void {
    if (!this.subscription.closed) {
      this.subscription.unsubscribe();
    }
  }
}
