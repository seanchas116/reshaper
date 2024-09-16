import { computed, makeObservable, observable } from "mobx";
import { InstanceManager } from "./instance-manager";
import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

export type BasicNodeData = {
  readonly parent?: string;
  readonly order?: string;
};

interface SelectionStore {
  has(id: string): boolean;
  add(id: string): void;
  delete(id: string): void;
}

export class BasicNode<TData extends BasicNodeData> {
  constructor(
    instances: InstanceManager<TData, BasicNode<TData>>,
    selection: SelectionStore,
    id: string,
  ) {
    this.instances = instances;
    this.selection = selection;
    this.id = id;
    makeObservable(this);
  }

  readonly instances: InstanceManager<TData, BasicNode<TData>>;
  readonly selection: SelectionStore;
  readonly id: string;

  @computed get data(): TData {
    return this.instances.store.data.get(this.id)!;
  }

  set data(data: TData) {
    this.instances.store.data.set(this.id, data);
  }

  @computed get children(): this[] {
    return this.instances.parenting
      .getChildren(this.id)
      .items.map((id) => this.instances.get(id) as this);
  }

  childAt(index: number): this | undefined {
    const id = this.instances.parenting.getChildren(this.id).items[index];
    return id ? (this.instances.get(id) as this) : undefined;
  }

  @computed get parent(): this | undefined {
    const parentId = this.data.parent;
    return parentId ? (this.instances.get(parentId) as this) : undefined;
  }

  @computed get root(): this {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node = this;
    while (node.parent) {
      node = node.parent;
    }
    return node;
  }

  @computed get ancestors(): this[] {
    const parent = this.parent;
    if (!parent) {
      return [];
    }
    return [...parent.ancestors, parent];
  }

  @computed get siblings(): this[] {
    return this.parent?.children ?? [];
  }

  @computed get nextSibling(): this | undefined {
    return this.siblings[this.index + 1];
  }

  @computed get previousSibling(): this | undefined {
    return this.siblings[this.index - 1];
  }

  get index(): number {
    const parentId = this.data.parent;
    if (!parentId) {
      return -1;
    }

    return (
      this.instances.parenting.getChildren(parentId).indices.get(this.id) ?? -1
    );
  }

  @computed get indexPath(): number[] {
    const parent = this.parent;
    if (!parent) {
      return [];
    }
    return [...parent.indexPath, this.index];
  }

  includes(other: this): boolean {
    return other.ancestors.includes(this);
  }

  insertBefore(
    nodes: readonly this[],
    next: this | undefined,
  ): readonly this[] {
    nodes = nodes.filter((node) => node !== this && !node.includes(this));

    const children = this.children;
    const prev = children[(next?.index ?? children.length) - 1];

    const keys = generateNKeysBetween(prev?.order, next?.order, nodes.length);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      node.data = {
        ...node.data,
        parent: this.id,
        order: keys[i],
      };
    }

    return nodes;
  }

  append(nodes: readonly this[]): readonly this[] {
    return this.insertBefore(nodes, undefined);
  }

  get order(): string {
    return this.data.order ?? generateKeyBetween(null, null);
  }

  @computed get selected(): boolean {
    return this.selection.has(this.id);
  }

  select(): void {
    for (const child of this.children) {
      child.deselect();
    }
    this.selection.add(this.id);
  }

  deselect(): void {
    this.selection.delete(this.id);
    for (const child of this.children) {
      child.deselect();
    }
  }

  @computed get ancestorSelected(): boolean {
    return this.selected || this.parent?.ancestorSelected || false;
  }

  @observable expanded = false;

  expandAllAncestors() {
    let node = this.parent;
    while (node) {
      node.expanded = true;
      node = node.parent;
    }
  }

  delete() {
    for (const child of this.children) {
      child.delete();
    }

    this.selection.delete(this.id);
    this.instances.store.data.delete(this.id);
  }
}
