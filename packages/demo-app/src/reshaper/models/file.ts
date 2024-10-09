import traverse, { NodePath } from "@babel/traverse";
import { BabelNodeType, Node, RecursiveNodeData } from "./node";
import { Workspace } from "./workspace";
import * as babel from "@babel/types";
import deepEqual from "deep-equal";
import { action } from "mobx";

function findClassNameValue(node: babel.JSXElement) {
  const className = node.openingElement.attributes.find(
    (attr): attr is babel.JSXAttribute => {
      return attr.type === "JSXAttribute" && attr.name.name === "className";
    },
  );
  const value = className?.value;
  return value?.type === "StringLiteral" ? value.value : undefined;
}

export class File {
  readonly workspace: Workspace;
  readonly filePath: string;
  readonly node: Node;
  code: string;
  babelNode: babel.File;

  readonly nodeForElementIndex = new Map<number, Node>();
  readonly elementIndexForNode = new Map<Node, number>();

  initialStructures = new Map<string, RecursiveNodeData>();

  constructor(
    workspace: Workspace,
    filePath: string,
    code: string,
    babelNode: babel.File,
  ) {
    this.workspace = workspace;
    this.filePath = filePath;
    this.code = code;
    this.babelNode = babelNode;
    this.node = this.workspace.nodes.add(this.filePath, {
      babelNode: this.babelNode,
    });
    this.load(code, babelNode);
  }

  @action load(code: string, babelNode: babel.File) {
    this.code = code;
    this.babelNode = babelNode;
    this.nodeForElementIndex.clear();
    this.elementIndexForNode.clear();

    const selectedIDs = new Set(this.workspace.selectedNodeIDs);

    // tree structure:
    // file
    //  JSXElement or JSXFragment
    //   JSXElement or JSXFragment
    //   JSXText
    //   JSXExpressionContainer or JSXSpreadChild
    //     JSXElement or JSXFragment
    //     (recursive)
    //  ...

    const nodeForBabelNode = new Map<
      BabelNodeType,
      { node: Node; babelNodeForParent: BabelNodeType }
    >();

    let nodeIndex = 0;

    const toplevelStatementNodes = this.babelNode.program.body.map(
      (statement, i) => {
        return this.workspace.nodes.add(
          (this.filePath + ":statement:" + i).toString(),
          {
            babelNode: statement,
          },
        );
      },
    );

    for (const toplevel of toplevelStatementNodes) {
      nodeForBabelNode.set(toplevel.data.babelNode, {
        node: toplevel,
        babelNodeForParent: this.babelNode,
      });
    }

    {
      const visitElementOrFragment = (
        path: NodePath<babel.JSXElement> | NodePath<babel.JSXFragment>,
      ) => {
        nodeIndex++;

        path.node.children;
        const node = this.workspace.nodes.add(this.filePath + ":" + nodeIndex, {
          babelNode: path.node,
          className:
            path.node.type === "JSXElement"
              ? findClassNameValue(path.node)
              : undefined,
        });
        this.nodeForElementIndex.set(nodeIndex, node);
        this.elementIndexForNode.set(node, nodeIndex);

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
          })?.node as
            | babel.JSXExpressionContainer
            | babel.JSXSpreadChild
            | null;

          const toplevelStatement = path.findParent((p) => {
            return p.parent.type === "Program";
          })?.node as babel.Statement | null;

          babelParent = babelParent ?? toplevelStatement;
        }

        if (!babelParent) {
          return;
        }

        nodeForBabelNode.set(path.node, {
          node,
          babelNodeForParent: babelParent,
        });
      };

      const visitOtherJSXChild = (
        path:
          | NodePath<babel.JSXText>
          | NodePath<babel.JSXExpressionContainer>
          | NodePath<babel.JSXSpreadChild>,
      ) => {
        nodeIndex++;

        if (
          path.parent.type !== "JSXElement" &&
          path.parent.type !== "JSXFragment"
        ) {
          return;
        }

        const node = this.workspace.nodes.add(this.filePath + ":" + nodeIndex, {
          babelNode: path.node,
          ...(path.node.type === "JSXText"
            ? { text: path.node.value }
            : undefined),
        });
        this.nodeForElementIndex.set(nodeIndex, node);
        this.elementIndexForNode.set(node, nodeIndex);

        nodeForBabelNode.set(path.node, {
          node,
          babelNodeForParent: path.parent,
        });
      };

      // create nodes
      traverse(this.babelNode, {
        JSXText: visitOtherJSXChild,
        JSXExpressionContainer: visitOtherJSXChild,
        JSXSpreadChild: visitOtherJSXChild,
        JSXElement: visitElementOrFragment,
        JSXFragment: visitElementOrFragment,
      });
    }

    for (const {
      node,
      babelNodeForParent: babelParent,
    } of nodeForBabelNode.values()) {
      const parent = nodeForBabelNode.get(babelParent)?.node;
      if (parent) {
        parent.append([node]);
      }
    }

    this.node.data = {
      ...this.node.data,
      babelNode: babelNode,
    };

    for (const child of this.node.children) {
      child.delete();
    }

    this.node.append(
      toplevelStatementNodes.filter((node) => node.children.length > 0),
    );

    this.initialStructures = this.getStructures();

    this.workspace.selectedNodeIDs.replace(
      [...selectedIDs].filter((id) => this.workspace.nodes.safeGet(id)),
    );
  }

  private getSelectedIndexPaths(): readonly number[][] {
    const result: number[][] = [];
    const visit = (node: Node) => {
      if (node.selected) {
        result.push(node.indexPath);
      }
      for (const child of node.children) {
        visit(child);
      }
    };
    visit(this.node);
    return result;
  }

  private applySelectedIndexPaths(indexPaths: readonly number[][]) {
    const selectedNodeIDs = new Set<string>();
    const visit = (node: Node) => {
      const shouldSelect = indexPaths.some((indexPath) => {
        return deepEqual(node.indexPath, indexPath);
      });
      if (shouldSelect) {
        selectedNodeIDs.add(node.id);
      }

      for (const child of node.children) {
        visit(child);
      }
    };
    visit(this.node);
    this.workspace.selectedNodeIDs.replace(selectedNodeIDs);
  }

  toModifiedAST(): babel.File {
    return this.node.toModifiedBabelNode() as babel.File;
  }

  getStructures(): Map<string, RecursiveNodeData> {
    const ret = new Map<string, RecursiveNodeData>();

    const visit = (
      node: RecursiveNodeData,
      parent: RecursiveNodeData | undefined,
    ) => {
      if (
        // is a element/fragment and parent is not a element/fragment
        (node.babelNode.type === "JSXElement" ||
          node.babelNode.type === "JSXFragment") &&
        !(
          parent?.babelNode.type === "JSXElement" ||
          parent?.babelNode.type === "JSXFragment"
        )
      ) {
        ret.set(node.id, node);
      }

      for (const child of node.children) {
        visit(child, node);
      }
    };
    visit(this.node.toRecursiveData(), undefined);

    return ret;
  }
}
