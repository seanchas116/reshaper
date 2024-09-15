import { generateKeyBetween } from "fractional-indexing";
import { Store } from "./store";
import { createAtom } from "mobx";

export interface FractionalSortResult {
  items: string[];
  indices: Map<string, number>;
}

export class FractionalSort<TData> {
  constructor(
    store: Store<string, TData>,
    getOrder: (data: TData) => string | undefined,
  ) {
    this.store = store;
    this.getOrder = getOrder;
  }

  readonly store: Store<string, TData>;
  readonly getOrder: (data: TData) => string | undefined;

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
        const aOrder = aData
          ? (this.getOrder(aData) ?? generateKeyBetween(null, null))
          : generateKeyBetween(null, null);
        const bOrder = bData
          ? (this.getOrder(bData) ?? generateKeyBetween(null, null))
          : generateKeyBetween(null, null);

        return compareStrings(aOrder, bOrder) || compareStrings(a, b);
      });

      this.cache = {
        items: children,
        indices: new Map(children.map((id, index) => [id, index])),
      };
    }
    return this.cache;
  }
}

function compareStrings(a: string, b: string) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
