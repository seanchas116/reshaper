import { observable, action, computed, makeObservable } from "mobx";

export interface UndoCommand {
  title?: string;
  undo(): void;
  redo(): void;
  merge?(other: UndoCommand): UndoCommand | undefined;
}

export class UndoStack<T extends UndoCommand = UndoCommand> {
  constructor() {
    makeObservable(this);
  }

  private readonly _commands = observable<T>([]);
  @observable private doneCount = 0;

  get commands(): readonly T[] {
    return [...this._commands];
  }

  @computed get isEmpty(): boolean {
    return this.commands.length === 0;
  }

  @computed get commandToUndo(): T | undefined {
    if (this.canUndo) {
      return this._commands[this.doneCount - 1];
    }
  }
  @computed get commandToRedo(): T | undefined {
    if (this.canRedo) {
      return this._commands[this.doneCount];
    }
  }

  @computed get undoTitle(): string | undefined {
    return this.commandToUndo?.title;
  }

  @computed get redoTitle(): string | undefined {
    return this.commandToRedo?.title;
  }

  @computed get canUndo(): boolean {
    return 0 < this.doneCount;
  }

  @computed get canRedo(): boolean {
    return this.doneCount < this._commands.length;
  }

  @action clearRedos(): void {
    if (this.canRedo) {
      this._commands.replace(this._commands.slice(0, this.doneCount));
    }
  }

  @action push(command: T): void {
    this.clearRedos();
    if (this._commands.length) {
      const last = this._commands[this._commands.length - 1];
      const merged = last.merge?.(command);
      if (merged) {
        this._commands[this._commands.length - 1] = merged as T;
        return;
      }
    }

    this._commands.push(command);
    this.doneCount = this._commands.length;
  }

  @action undo(): void {
    if (!this.canUndo) {
      return;
    }
    --this.doneCount;
    this._commands[this.doneCount].undo();
  }

  @action redo(): void {
    if (!this.canRedo) {
      return;
    }
    this._commands[this.doneCount].redo();
    ++this.doneCount;
  }

  @action clear(): void {
    this._commands.clear();
    this.doneCount = 0;
  }
}
