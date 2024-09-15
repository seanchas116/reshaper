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

  readonly fileNodes = new Map<string, Node>();

  loadFileAST(filePath: string, file: babel.File) {
    const existingNode = this.fileNodes.get(filePath);
    if (existingNode) {
      existingNode.delete();
    }

    const fileNode = this.nodes.add("file:" + filePath, {
      babelNode: file,
    });

    const nodeForBabelNode = new Map<
      babel.Node,
      { node: Node; babelParent: babel.Node }
    >();

    // create nodes
    traverse(file, {
      JSXElement: (path) => {
        path.parent;
        const node = this.nodes.add(
          path.node.loc!.start.line + ":" + path.node.loc!.start.column,
          {
            babelNode: path.node,
            className: findClassNameValue(path.node),
          },
        );
        nodeForBabelNode.set(path.node, { node, babelParent: path.parent });
      },
    });

    for (const { node, babelParent } of nodeForBabelNode.values()) {
      const parent = nodeForBabelNode.get(babelParent)?.node;
      if (parent) {
        parent.append([node]);
      } else {
        fileNode.append([node]);
      }
    }

    this.fileNodes.set(filePath, fileNode);
    return fileNode;
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
