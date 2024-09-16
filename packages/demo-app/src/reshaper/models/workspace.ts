import { Node, NodeData } from "./node";
import { Store } from "../utils/store/store";
import { UndoManager } from "../utils/store/undo-manager";
import { Parenting } from "../utils/store/parenting";
import { computed, makeObservable, observable } from "mobx";
import * as babel from "@babel/types";
import compact from "just-compact";
import { InstanceManager } from "../utils/node/instance-manager";
import { File } from "./file";

export class Workspace {
  constructor() {
    this.nodeStore = new Store<string, NodeData>();

    this.undoManager = new UndoManager([this.nodeStore]);

    this.nodes = new InstanceManager(this.nodeStore, {
      factory: (_, id) => new Node(this, id),
      getParent: (data) => data.parent,
      getOrder: (data) => data.order,
    });
    this.nodeParenting = new Parenting(
      this.nodeStore,
      (data) => data.parent,
      (data) => data.order,
    );

    this.undoManager.clear();

    makeObservable(this);
  }

  readonly undoManager: UndoManager;
  readonly nodeStore: Store<string, NodeData>;
  readonly nodes: InstanceManager<NodeData, Node>;
  readonly nodeParenting: Parenting<NodeData>;
  readonly selectedNodeIDs = observable.set<string>();

  @computed get selectedNodes(): Node[] {
    return compact(
      Array.from(this.selectedNodeIDs).map((id) => this.nodes.safeGet(id)),
    );
  }

  clearSelection() {
    this.selectedNodeIDs.clear();
  }

  readonly files = new Map<string, File>();

  loadFileAST(filePath: string, babelFile: babel.File) {
    const oldFile = this.files.get(filePath);
    if (oldFile) {
      oldFile.delete();
    }

    const file = new File(this, filePath, babelFile);
    this.files.set(filePath, file);
  }

  nodeForLocation(
    filePath: string,
    line: number,
    column: number,
  ): Node | undefined {
    return this.nodes.safeGet(`${filePath}:${line}:${column}`);
  }
}
