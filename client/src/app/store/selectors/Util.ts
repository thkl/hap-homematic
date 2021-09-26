import { Store } from "@ngrx/store";
import { take } from "rxjs/operators";
import { CCUChannel, CCUProgram, CCUVariable, HapAppliance, HapInstance } from "../models";

export const getInstance = (store: Store, selector: any): HapInstance => {
  let instance: HapInstance;
  store.select(selector).pipe(take(1)).subscribe(
    s => instance = (s as HapInstance)
  );
  return instance;
}

export const getVariable = (store: Store, selector: any): CCUVariable => {
  let variable: CCUVariable;
  store.select(selector).pipe(take(1)).subscribe(
    s => variable = (s as CCUVariable)
  );
  return variable;
}
export const getProgram = (store: Store, selector: any): CCUProgram => {
  let program: CCUProgram;
  store.select(selector).pipe(take(1)).subscribe(
    s => program = (s as CCUProgram)
  );
  return program;
}

export const getChannel = (store: Store, selector: any): CCUChannel => {
  let channel: CCUChannel;
  store.select(selector).pipe(take(1)).subscribe(
    s => channel = (s as CCUChannel)
  );
  return channel;
}

export const getAppliance = (store: Store, selector: any): HapAppliance => {
  let appliance: HapAppliance;
  store.select(selector).pipe(take(1)).subscribe(
    s => appliance = (s as HapAppliance)
  );
  return appliance;
}

