import { observable } from "mobx";

export class Store<K extends string, T> {
  constructor() {}

  readonly data = observable.map<K, T>([], { deep: false });
}
