import { getOrCreate } from "../get-or-create";
import { UndoStack } from "../undo-stack";
import { Store } from "./store";

export class UndoManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(stores: Store<string, any>[]) {
    this.stores = stores;

    for (const store of stores) {
      this.disposers.push(
        store.data.observe_((change) => {
          if (change.type === "add") {
            this.stageChanges(store, change.name, undefined, change.newValue);
          } else if (change.type === "delete") {
            this.stageChanges(store, change.name, change.oldValue, undefined);
          } else {
            this.stageChanges(
              store,
              change.name,
              change.oldValue,
              change.newValue
            );
          }
        })
      );
    }
  }

  dispose() {
    for (const disposer of this.disposers) {
      disposer();
    }
  }

  readonly disposers: (() => void)[] = [];
  readonly stores: Store<string, unknown>[];
  private lastCommand: UndoManagerCommand | undefined;
  private undoStack = new UndoStack<UndoManagerCommand>();

  get canUndo(): boolean {
    return this.undoStack.canUndo;
  }

  get canRedo(): boolean {
    return this.undoStack.canRedo;
  }

  undo(): void {
    this.undoStack.undo();
    this.lastCommand = undefined;
  }

  redo(): void {
    this.undoStack.redo();
    this.lastCommand = undefined;
  }

  clear(): void {
    this.undoStack.clear();
    this.lastCommand = undefined;
  }

  commit(): void {
    this.lastCommand = undefined;
  }

  stageChanges(
    store: Store<string, unknown>,
    id: string,
    oldData: unknown,
    newData: unknown
  ) {
    if (this.duringUndoRedo) {
      return;
    }

    if (!this.lastCommand || this.lastCommand.timestamp < Date.now() - 1000) {
      this.lastCommand = new UndoManagerCommand(this);
      this.undoStack.push(this.lastCommand);
    } else {
      this.lastCommand.timestamp = Date.now();
    }

    const changes = getOrCreate(
      this.lastCommand.changesForStore,
      store,
      () => new Map<string, { oldData: unknown; newData: unknown }>()
    );
    const staged = changes.get(id);
    if (staged) {
      staged.newData = newData;
    } else {
      changes.set(id, { oldData, newData });
    }
  }

  duringUndoRedo = false;
}

class UndoManagerCommand {
  constructor(undoManager: UndoManager) {
    this.undoManager = undoManager;
  }

  readonly undoManager: UndoManager;
  timestamp = Date.now();
  readonly changesForStore = new Map<
    Store<string, unknown>,
    Map<string, { oldData: unknown; newData: unknown }>
  >();

  undo() {
    try {
      this.undoManager.duringUndoRedo = true;

      for (const [store, changes] of this.changesForStore) {
        for (const [id, { oldData }] of changes) {
          if (oldData == null) {
            store.data.delete(id);
          } else {
            store.data.set(id, oldData);
          }
        }
      }
    } finally {
      this.undoManager.duringUndoRedo = false;
    }
  }
  redo() {
    try {
      this.undoManager.duringUndoRedo = true;

      for (const [store, changes] of this.changesForStore) {
        for (const [id, { newData }] of changes) {
          if (newData == null) {
            store.data.delete(id);
          } else {
            store.data.set(id, newData);
          }
        }
      }
    } finally {
      this.undoManager.duringUndoRedo = false;
    }
  }
}
