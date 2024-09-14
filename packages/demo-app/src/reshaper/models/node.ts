import { computed, makeObservable, observable } from "mobx";
import { Document } from "./document";
import { lerp } from "../utils/math";
import * as babel from "@babel/types";

export type NodeData = {
  readonly parent?: string;
  readonly order: number;
  readonly content:
    | {
        readonly type: "element";
        readonly node: babel.JSXElement;
      }
    | {
        readonly type: "text";
        readonly node: babel.JSXText;
      }
    | {
        readonly type: "fragment";
        readonly node: babel.JSXFragment;
      }
    | {
        readonly type: "other";
        readonly node: babel.Node;
      };
};

export class Node {
  constructor(document: Document, id: string) {
    this.document = document;
    this.id = id;
    makeObservable(this);
  }

  readonly document: Document;
  readonly id: string;

  @computed get data(): NodeData {
    return this.document.nodeStore.data.get(this.id)!;
  }

  set data(data: NodeData) {
    this.document.nodeStore.data.set(this.id, data);
  }

  @computed get children(): Node[] {
    return this.document.nodeParenting
      .getChildren(this.id)
      .items.map((id) => this.document.nodes.get(id));
  }

  childAt(index: number): Node | undefined {
    const id = this.document.nodeParenting.getChildren(this.id).items[index];
    return id ? this.document.nodes.get(id) : undefined;
  }

  @computed get parent(): Node | undefined {
    const parentId = this.data.parent;
    return parentId ? this.document.nodes.get(parentId) : undefined;
  }

  @computed get root(): Node {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: Node = this;
    while (node.parent) {
      node = node.parent;
    }
    return node;
  }

  @computed get ancestors(): Node[] {
    const parent = this.parent;
    if (!parent) {
      return [];
    }
    return [...parent.ancestors, parent];
  }

  @computed get siblings(): Node[] {
    return this.parent?.children ?? [];
  }

  @computed get nextSibling(): Node | undefined {
    return this.siblings[this.index + 1];
  }

  @computed get previousSibling(): Node | undefined {
    return this.siblings[this.index - 1];
  }

  get index(): number {
    const parentId = this.data.parent;
    if (!parentId) {
      return -1;
    }

    return (
      this.document.nodeParenting.getChildren(parentId).indices.get(this.id) ??
      -1
    );
  }

  @computed get indexPath(): number[] {
    const parent = this.parent;
    if (!parent) {
      return [];
    }
    return [...parent.indexPath, this.index];
  }

  includes(other: Node): boolean {
    return other.ancestors.includes(this);
  }

  insertBefore(
    nodes: readonly Node[],
    next: Node | undefined,
  ): readonly Node[] {
    nodes = nodes.filter((node) => !node.includes(this));

    const children = this.children;
    const prev = children[(next?.index ?? children.length) - 1];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const order =
        prev && next
          ? lerp(prev.order ?? 0, next.order ?? 0, (i + 1) / (nodes.length + 1))
          : prev
            ? (prev.order ?? 0) + i + 1
            : next
              ? (next.order ?? 0) - nodes.length + i
              : i;

      node.data = {
        ...node.data,
        parent: this.id,
        order,
      };
    }

    return nodes;
  }

  get order(): number {
    return this.data.order;
  }

  @computed get selected(): boolean {
    return this.document.selectedNodeIDs.has(this.id);
  }

  select(): void {
    for (const child of this.children) {
      child.deselect();
    }
    this.document.selectedNodeIDs.add(this.id);
  }

  deselect(): void {
    this.document.selectedNodeIDs.delete(this.id);
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

  get content(): NodeData["content"] {
    return this.data.content;
  }

  @computed get mayHaveChildren() {
    return this.content.type === "element" || this.content.type === "fragment";
  }

  delete() {
    for (const child of this.children) {
      child.delete();
    }

    this.document.selectedNodeIDs.delete(this.id);
    this.document.nodeStore.data.delete(this.id);
  }
}
