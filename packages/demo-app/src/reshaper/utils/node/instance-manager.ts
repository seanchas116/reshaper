import { Store } from "@/reshaper/utils/store/store";
import { Parenting } from "../store/parenting";

export class InstanceManager<TData, TInstance> {
  constructor(
    store: Store<string, TData>,
    {
      factory,
      getParent,
      getOrder,
    }: {
      factory: (id: string) => TInstance;
      getParent: (data: TData) => string | undefined;
      getOrder: (data: TData) => number;
    },
  ) {
    this.store = store;
    this.store.data.observe_((change) => {
      if (change.type === "add") {
        this.instances.set(change.name, factory(change.name));
      } else if (change.type === "delete") {
        this.instances.delete(change.name);
      }
    });
    this.parenting = new Parenting<TData>(this.store, getParent, getOrder);
  }

  readonly store: Store<string, TData>;
  readonly instances = new Map<string, TInstance>();
  readonly parenting: Parenting<TData>;

  add(id: string, data: TData): TInstance {
    this.store.data.set(id, data);
    return this.instances.get(id)!;
  }

  safeGet(id: string): TInstance | undefined {
    return this.instances.get(id);
  }

  get(id: string): TInstance {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new Error(`Instance not found: ${id}`);
    }
    return instance;
  }
}
