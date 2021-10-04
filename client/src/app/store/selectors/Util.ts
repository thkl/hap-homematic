import { Store } from "@ngrx/store";
import { take } from "rxjs/operators";
import { CCUChannel, CCUProgram, CCUVariable, HapAppliance, HapInstance } from "../models";

export const getInstance = (store: Store, selector: any): HapInstance => {
  let instance: HapInstance;
  const sb = store.select(selector).pipe(take(1)).subscribe(
    s => instance = (s as HapInstance)
  );
  sb.unsubscribe();
  return instance;
}

export const getVariable = (store: Store, selector: any): CCUVariable => {
  let variable: CCUVariable;
  const sb = store.select(selector).pipe(take(1)).subscribe(
    s => variable = (s as CCUVariable)
  );
  sb.unsubscribe();
  return variable;
}
export const getProgram = (store: Store, selector: any): CCUProgram => {
  let program: CCUProgram;
  const sb = store.select(selector).pipe(take(1)).subscribe(
    s => program = (s as CCUProgram)
  );
  sb.unsubscribe();
  return program;
}

export const getChannel = (store: Store, selector: any): CCUChannel => {
  let channel: CCUChannel;
  const sb = store.select(selector).pipe(take(1)).subscribe(
    s => channel = (s as CCUChannel)
  );
  sb.unsubscribe();
  return channel;
}

export const getAppliance = (store: Store, selector: any): HapAppliance => {
  let appliance: HapAppliance;
  const sb = store.select(selector).pipe(take(1)).subscribe(
    s => appliance = (s as HapAppliance)
  );
  sb.unsubscribe();
  return appliance;
}

