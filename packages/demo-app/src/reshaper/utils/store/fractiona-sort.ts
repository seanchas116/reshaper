import { Store } from "./store";
import { createAtom } from "mobx";

export interface FractionalSortResult {
  items: string[];
  indices: Map<string, number>;
}

export class FractionalSort<TData> {
  constructor(store: Store<string, TData>, getOrder: (data: TData) => number) {
    this.store = store;
    this.getOrder = getOrder;
  }

  readonly store: Store<string, TData>;
  readonly getOrder: (data: TData) => number;

  readonly items = new Set<string>();
  private cache: FractionalSortResult | undefined;
  readonly atom = createAtom("FractionalSort");

  add(id: string) {
    this.items.add(id);
    this.cache = undefined;
    this.atom.reportChanged();
  }

  delete(id: string) {
    this.items.delete(id);
    this.cache = undefined;
    this.atom.reportChanged();
  }

  get(): FractionalSortResult {
    this.atom.reportObserved();

    if (!this.cache) {
      const children = [...this.items];

      children.sort((a, b) => {
        const aData = this.store.data.get(a);
        const bData = this.store.data.get(b);
        const aOrder = aData ? this.getOrder(aData) : 0;
        const bOrder = bData ? this.getOrder(bData) : 0;
        return aOrder - bOrder;
      });

      this.cache = {
        items: children,
        indices: new Map(children.map((id, index) => [id, index])),
      };
    }
    return this.cache;
  }
}
