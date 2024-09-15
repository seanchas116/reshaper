import { makeObservable, computed } from "mobx";

function compareIndexPath(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const diff = a[i] - b[i];
    if (diff !== 0) {
      return diff;
    }
  }
  return a.length - b.length;
}

export abstract class TreeViewItem {
  constructor() {
    makeObservable(this);
  }

  abstract readonly id: string;

  abstract readonly parent: TreeViewItem | undefined;
  abstract readonly previousSibling: TreeViewItem | undefined;
  abstract readonly nextSibling: TreeViewItem | undefined;
  abstract readonly children: readonly TreeViewItem[];
  abstract readonly indexPath: readonly number[];

  abstract collapsed: boolean;

  abstract readonly hovered: boolean;
  abstract enterHover(): void;
  abstract leaveHover(): void;

  abstract readonly selected: boolean;
  abstract select(): void;
  abstract deselect(): void;

  abstract get allSelectedItems(): TreeViewItem[];
  abstract deselectAll(): void;

  abstract readonly draggable: boolean;
  abstract readonly droppable: boolean;
  abstract drop(next: TreeViewItem | undefined, copy: boolean): void;

  abstract readonly dimmed: boolean;
  abstract readonly isInstanceContent: boolean; // TODO: generalize
  abstract renderContent(): React.ReactNode;
  abstract showContextMenu(e: React.MouseEvent): void;

  @computed get ancestorSelected(): boolean {
    return (
      this.selected || !!(this.parent as this | undefined)?.ancestorSelected
    );
  }

  @computed get prevInTreeView(): TreeViewItem | undefined {
    const prev = this.previousSibling;
    if (prev) {
      let ret = prev;
      while (!ret.collapsed && ret.children.length > 0) {
        ret = ret.children[ret.children.length - 1];
      }
      return ret;
    }

    const parent = this.parent;
    if (!parent) {
      return undefined;
    }

    return parent;
  }

  @computed get nextInTreeView(): TreeViewItem | undefined {
    const children = this.children;
    if (!this.collapsed && children.length > 0) {
      return children[0];
    }

    let current: TreeViewItem = this;
    for (;;) {
      const next = current.nextSibling;
      if (next) {
        return next;
      }
      if (!current.parent) {
        break;
      }
      current = current.parent;
    }
  }

  static selectBetween(items: readonly TreeViewItem[]): void {
    if (items.length === 0) {
      return;
    }

    const sortedItems = [...items].sort((a, b) =>
      compareIndexPath(a.indexPath, b.indexPath)
    );

    const first = sortedItems[0];
    const last = sortedItems[sortedItems.length - 1];

    const all = [first];
    let current: TreeViewItem | undefined = first;
    while (current && current !== last) {
      current = current.nextInTreeView;
      if (current) {
        all.push(current);
      }
    }

    items[0].deselectAll();
    for (const item of all) {
      item.select();
    }
  }
}
