import { BabelNodeType, Node, NodeData } from "./node";
import { Store } from "../utils/store/store";
import { UndoManager } from "../utils/store/undo-manager";
import { Parenting } from "../utils/store/parenting";
import { computed, makeObservable, observable } from "mobx";
import * as babel from "@babel/types";
import traverse, { NodePath } from "@babel/traverse";
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
    // tree structure:
    // file
    //  JSXElement or JSXFragment
    //   JSXElement or JSXFragment
    //   JSXText
    //   JSXExpressionContainer or JSXSpreadChild
    //     JSXElement or JSXFragment
    //     (recursive)
    //  ...

    const existingNode = this.fileNodes.get(filePath);
    if (existingNode) {
      existingNode.delete();
    }

    const fileNode = this.nodes.add("file:" + filePath, {
      babelNode: file,
    });

    const nodeForBabelNode = new Map<
      BabelNodeType,
      { node: Node; babelParent: BabelNodeType }
    >();

    const visitElementOrFragment = (
      path: NodePath<babel.JSXElement> | NodePath<babel.JSXFragment>,
    ) => {
      path.node.children;
      const node = this.nodes.add(
        path.node.loc!.start.line + ":" + path.node.loc!.start.column,
        {
          babelNode: path.node,
          className:
            path.node.type === "JSXElement"
              ? findClassNameValue(path.node)
              : undefined,
        },
      );

      let babelParent;
      if (
        path.parent.type === "JSXElement" ||
        path.parent.type === "JSXFragment"
      ) {
        babelParent = path.parent;
      } else {
        // find closes expression container or spread child
        babelParent = path.findParent((p) => {
          return (
            p.type === "JSXExpressionContainer" || p.type === "JSXSpreadChild"
          );
        })?.node as babel.JSXExpressionContainer | babel.JSXSpreadChild | null;
      }

      nodeForBabelNode.set(path.node, {
        node,
        babelParent: babelParent ?? file,
      });
    };

    const visitOtherJSXChild = (
      path:
        | NodePath<babel.JSXText>
        | NodePath<babel.JSXExpressionContainer>
        | NodePath<babel.JSXSpreadChild>,
    ) => {
      if (
        path.parent.type !== "JSXElement" &&
        path.parent.type !== "JSXFragment"
      ) {
        return;
      }

      const node = this.nodes.add(
        path.node.loc!.start.line + ":" + path.node.loc!.start.column,
        {
          babelNode: path.node,
        },
      );

      nodeForBabelNode.set(path.node, { node, babelParent: path.parent });
    };

    // create nodes
    traverse(file, {
      JSXText: visitOtherJSXChild,
      JSXExpressionContainer: visitOtherJSXChild,
      JSXSpreadChild: visitOtherJSXChild,
      JSXElement: visitElementOrFragment,
      JSXFragment: visitElementOrFragment,
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
