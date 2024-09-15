import { ReactNode, MouseEvent } from "react";
import { NodeTreeRow } from "./node-tree-row";
import { makeObservable, computed, observable } from "mobx";
import React from "react";
import { TreeViewItem } from "@/reshaper/components/treeview/tree-view-item";
import { EditorState } from "@/reshaper/state/editor-state";
import { Node } from "@/reshaper/models/node";

const instances = new WeakMap<Node, NodeTreeViewItem>();

export class NodeTreeViewItem extends TreeViewItem {
  static get(editorState: EditorState, node: Node) {
    // TODO: add weakmap for editorstate
    let instance = instances.get(node);
    if (!instance) {
      instance = new NodeTreeViewItem(editorState, node);
      instances.set(node, instance);
    }
    return instance;
  }

  constructor(editorState: EditorState, node: Node) {
    super();
    this.editorState = editorState;
    this.node = node;
    makeObservable(this);
  }

  readonly editorState: EditorState;
  readonly node: Node;

  @computed get id(): string {
    return this.node.id;
  }

  @computed get parent(): NodeTreeViewItem | undefined {
    const parent = this.node.parent;
    if (parent) {
      return NodeTreeViewItem.get(this.editorState, parent);
    }
  }

  @computed get previousSibling(): NodeTreeViewItem | undefined {
    const prevSibling = this.node.previousSibling;
    if (prevSibling) {
      return NodeTreeViewItem.get(this.editorState, prevSibling);
    }
  }

  @computed get nextSibling(): NodeTreeViewItem | undefined {
    const nextSibling = this.node.nextSibling;
    if (nextSibling) {
      return NodeTreeViewItem.get(this.editorState, nextSibling);
    }
  }

  @computed get children(): NodeTreeViewItem[] {
    return this.node.children.map((child) =>
      NodeTreeViewItem.get(this.editorState, child),
    );
  }

  @computed get indexPath(): readonly number[] {
    return this.node.indexPath;
  }

  @computed get collapsed() {
    return !this.node.expanded;
  }

  set collapsed(value: boolean) {
    this.node.expanded = !value;
  }

  @computed get hovered() {
    return this.node.id === this.editorState.hoveredNodeID;
  }

  enterHover(): void {
    this.editorState.hoveredNodeID = this.node.id;
  }

  leaveHover(): void {
    this.editorState.hoveredNodeID = undefined;
  }

  @computed get selected() {
    return this.node.selected;
  }

  select(): void {
    this.node.select();
  }

  deselect(): void {
    this.node.deselect();
  }

  @computed get allSelectedItems(): TreeViewItem[] {
    return this.editorState.workspace.selectedNodes.map((n) =>
      NodeTreeViewItem.get(this.editorState, n),
    );
  }

  deselectAll(): void {
    this.editorState.workspace.clearSelection();
  }

  @computed get draggable() {
    return !!this.node.parent;
  }

  @computed get droppable() {
    return this.node.mayHaveChildren;
  }

  drop(nextItem: NodeTreeViewItem | undefined, shouldCopy: boolean): void {
    if (shouldCopy) {
      throw new Error("TODO: copy");
    }

    this.node.insertBefore(
      this.editorState.workspace.selectedNodes,
      nextItem?.node,
    );
  }

  @computed get dimmed(): boolean {
    return false;
  }

  @computed get isInstanceContent(): boolean {
    return false;
  }

  renderContent(): ReactNode {
    return React.createElement(NodeTreeRow, {
      item: this,
    });
  }

  showContextMenu(e: MouseEvent): void {
    // TODO
    // showNodeContextMenu(this.editorState, this.node, e);
  }
}

export class RootTreeViewItem extends TreeViewItem {
  static instances = new WeakMap<EditorState, RootTreeViewItem>();

  static get(editorState: EditorState) {
    // TODO: add weakmap for editorstate
    let instance = this.instances.get(editorState);
    if (!instance) {
      instance = new RootTreeViewItem(editorState);
      this.instances.set(editorState, instance);
    }
    return instance;
  }

  private constructor(editorState: EditorState) {
    super();
    this.editorState = editorState;
    makeObservable(this);
  }

  readonly editorState: EditorState;

  get id(): string {
    return "__root";
  }

  get parent(): NodeTreeViewItem | undefined {
    return undefined;
  }

  get previousSibling(): NodeTreeViewItem | undefined {
    return undefined;
  }

  get nextSibling(): NodeTreeViewItem | undefined {
    return undefined;
  }

  get children(): NodeTreeViewItem[] {
    return this.editorState.workspace.rootNodes.map((child) =>
      NodeTreeViewItem.get(this.editorState, child),
    );
  }

  @computed get indexPath(): readonly number[] {
    return [];
  }

  @observable collapsed = false;

  @computed get hovered() {
    return false;
  }
  enterHover(): void {}
  leaveHover(): void {}

  get selected() {
    return false;
  }

  select(): void {}
  deselect(): void {}

  @computed get allSelectedItems(): TreeViewItem[] {
    return this.editorState.workspace.selectedNodes.map((n) =>
      NodeTreeViewItem.get(this.editorState, n),
    );
  }

  deselectAll(): void {
    this.editorState.workspace.clearSelection();
  }

  get draggable() {
    return true;
  }

  get droppable() {
    return false;
  }

  drop(nextItem: NodeTreeViewItem | undefined, shouldCopy: boolean): void {}

  get dimmed(): boolean {
    return false;
  }

  get isInstanceContent(): boolean {
    return false;
  }

  renderContent(): ReactNode {
    return null;
  }

  showContextMenu(e: MouseEvent): void {
    // TODO
    // showNodeContextMenu(this.editorState, this.node, e);
  }
}
