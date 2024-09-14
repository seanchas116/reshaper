import { IMapDidChange } from "mobx";
import { Store } from "./store";
import { FractionalSort, FractionalSortResult } from "./fractiona-sort";
import { getOrCreate } from "../get-or-create";

export class Parenting<TData> {
  constructor(
    store: Store<string, TData>,
    getParent: (data: TData) => string | undefined,
    getOrder: (data: TData) => number
  ) {
    this.store = store;
    this.getParent = getParent;
    this.getOrder = getOrder;
    store.data.observe_(this.onChange.bind(this));
    for (const [name, data] of store.data) {
      const parent = getParent(data);
      if (parent) {
        this.getChildrenSort(parent).add(name);
      }
    }
  }

  private store: Store<string, TData>;
  private childrenMap = new Map<string, FractionalSort<TData>>();
  private getParent: (data: TData) => string | undefined;
  private getOrder: (data: TData) => number;

  private onChange(change: IMapDidChange<string, TData>) {
    const oldValue = "oldValue" in change ? change.oldValue : undefined;
    const newValue = "newValue" in change ? change.newValue : undefined;
    const oldParent = oldValue ? this.getParent(oldValue) : undefined;
    const newParent = newValue ? this.getParent(newValue) : undefined;
    const oldOrder = oldValue ? this.getOrder(oldValue) : 0;
    const newOrder = newValue ? this.getOrder(newValue) : 0;

    // position not changed
    if (oldParent === newParent && oldOrder === newOrder) {
      return;
    }

    // remove from old parent
    if (oldValue) {
      this.getChildrenSort(oldParent ?? "").delete(change.name);
    }

    // add to new parent
    if (newValue) {
      this.getChildrenSort(newParent ?? "").add(change.name);
    }
  }

  private getChildrenSort(parent: string): FractionalSort<TData> {
    return getOrCreate(
      this.childrenMap,
      parent,
      () => new FractionalSort(this.store, this.getOrder)
    );
  }

  getChildren(parent: string): FractionalSortResult {
    return this.getChildrenSort(parent).get();
  }

  getRoots(): FractionalSortResult {
    return this.getChildrenSort("").get();
  }
}
