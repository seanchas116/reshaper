import traverse, { NodePath } from "@babel/traverse";
import { BabelNodeType, Node } from "./node";
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

  private readonly nodeForSourceIndex = new Map<number, Node>();

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

  updateElementIndexForNode() {
    let elementIndex = 0;

    const visit = (node: Node) => {
      if (node.babelNode.type === "JSXElement") {
        this.nodeForElementIndex.set(elementIndex, node);
        this.elementIndexForNode.set(node, elementIndex);
        elementIndex++;
      }
      for (const child of node.children) {
        visit(child);
      }
    };

    visit(this.node);
  }

  @action load(code: string, babelNode: babel.File) {
    this.code = code;
    this.babelNode = babelNode;

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

    let id = 0;

    const toplevelStatementNodes = this.babelNode.program.body.map(
      (statement) => {
        return this.workspace.nodes.add(
          (this.filePath + ":" + id++).toString(),
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
        path.node.children;
        const node = this.workspace.nodes.add(this.filePath + ":" + id++, {
          babelNode: path.node,
          className:
            path.node.type === "JSXElement"
              ? findClassNameValue(path.node)
              : undefined,
        });

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
        if (
          path.parent.type !== "JSXElement" &&
          path.parent.type !== "JSXFragment"
        ) {
          return;
        }

        const node = this.workspace.nodes.add(this.filePath + ":" + id++, {
          babelNode: path.node,
          ...(path.node.type === "JSXText"
            ? { text: path.node.value }
            : undefined),
        });

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

    this.updateElementIndexForNode();

    this.workspace.selectedNodeIDs.replace(
      [...selectedIDs].filter((id) => this.workspace.nodes.safeGet(id)),
    );

    for (const { node } of nodeForBabelNode.values()) {
      this.nodeForSourceIndex.set(node.babelNode.loc!.start.index, node);
    }
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
}
