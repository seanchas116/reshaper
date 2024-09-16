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

  loadFileAST(filePath: string, code: string, babelFile: babel.File) {
    let file = this.files.get(filePath);
    if (!file) {
      file = new File(this, filePath, code, babelFile);
      this.files.set(filePath, file);
    } else {
      file.load(code, babelFile);
    }
    return file;
  }

  nodeForLocation(filePath: string, elementIndex: number): Node | undefined {
    return this.files.get(filePath)?.nodeForElementIndex.get(elementIndex);
  }
}
