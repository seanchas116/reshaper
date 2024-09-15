import { Node, NodeData } from "./node";
import { Store } from "../utils/store/store";
import { UndoManager } from "../utils/store/undo-manager";
import { Parenting } from "../utils/store/parenting";
import { computed, makeObservable, observable } from "mobx";
import * as babel from "@babel/types";
import traverse from "@babel/traverse";
import compact from "just-compact";
import { InstanceManager } from "../utils/node/instance-manager";

export class Workspace {
  constructor() {
    this.nodeStore = new Store<string, NodeData>();

    this.undoManager = new UndoManager([this.nodeStore]);

    this.nodes = new InstanceManager(this.nodeStore, {
      factory: (id) => new Node(this, id),
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

  @observable.ref rootNodes: Node[] = [];

  @computed get selectedNodes(): Node[] {
    return compact(
      Array.from(this.selectedNodeIDs).map((id) => this.nodes.safeGet(id)),
    );
  }

  loadFileAST(file: babel.File) {
    this.nodeStore.data.clear();

    const nodeForBabelNode = new Map<babel.Node, Node>();
    let order = 0;

    traverse(file, {
      JSXElement: (path) => {
        path.parent;
        const node = this.nodes.add(
          path.node.loc!.start.line + ":" + path.node.loc!.start.column,
          {
            parent: nodeForBabelNode.get(path.parent)?.id,
            order: order++,
            babelNode: path.node,
            className: findClassNameValue(path.node),
          },
        );
        nodeForBabelNode.set(path.node, node);
      },
    });

    this.rootNodes = [...nodeForBabelNode.values()].filter(
      (node) => !node.parent,
    );
  }

  nodeForLocation(line: number, column: number): Node | undefined {
    return this.nodes.safeGet(line + ":" + column);
  }
}

function findClassNameValue(node: babel.JSXElement) {
  const className = node.openingElement.attributes.find(
    (attr): attr is babel.JSXAttribute => {
      return attr.type === "JSXAttribute" && attr.name.name === "className";
    },
  );
  const value = className?.value;
  return value?.type === "StringLiteral" ? value.value : undefined;
}
