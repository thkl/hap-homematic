import { Store } from "@ngrx/store";
import { take } from "rxjs/operators";
import { HapInstance } from "../models";

export const getInstance = (store: Store, selector: any): HapInstance => {
  let instance: HapInstance;
  store.select(selector).pipe(take(1)).subscribe(
    s => instance = (s as HapInstance)
  );
  return instance;
}
