import { computed, makeObservable } from "mobx";
import { Workspace } from "./workspace";
import * as babel from "@babel/types";
import { BasicNode } from "../utils/node/basic-node";
import traverse from "@babel/traverse";

export type BabelNodeType =
  | babel.File
  | babel.Statement
  | babel.JSXElement
  | babel.JSXFragment
  | babel.JSXText
  | babel.JSXExpressionContainer
  | babel.JSXSpreadChild;

export type NodeData = {
  readonly parent?: string;
  readonly order?: string;
  readonly babelNode: BabelNodeType; // original babel node: do not edit this directly
  readonly className?: string;
};

export class Node extends BasicNode<NodeData> {
  constructor(workspace: Workspace, id: string) {
    super(workspace.nodes, workspace.selectedNodeIDs, id);
    this.workspace = workspace;
    this.id = id;
    makeObservable(this);
  }

  readonly workspace: Workspace;
  readonly id: string;

  get babelNode(): NodeData["babelNode"] {
    return this.data.babelNode;
  }

  get className(): string | undefined {
    return this.data.className;
  }

  set className(className: string | undefined) {
    this.data = {
      ...this.data,
      className,
    };
  }

  @computed get mayHaveChildren() {
    return (
      this.babelNode.type === "JSXElement" ||
      this.babelNode.type === "JSXFragment"
    );
  }

  get name(): string {
    const babelNode = this.babelNode;

    if (babelNode.type === "JSXText") {
      return babelNode.value;
    }

    if (babelNode.type === "JSXElement") {
      const nameNode = babelNode.openingElement.name;
      return nameNode.type === "JSXIdentifier" ? nameNode.name : "";
    }

    return "";
  }

  toModifiedBabelNode(): BabelNodeType {
    const original = this.babelNode;

    if (original.type === "JSXElement" || original.type === "JSXFragment") {
      const cloned = babel.cloneNode(original, true);

      if (cloned.type === "JSXElement") {
        const className = this.className;
        if (className) {
          const classNameAttr = cloned.openingElement.attributes.find(
            (attr): attr is babel.JSXAttribute => {
              return (
                attr.type === "JSXAttribute" && attr.name.name === "className"
              );
            },
          );
          if (classNameAttr) {
            classNameAttr.value = babel.stringLiteral(className);
          } else {
            cloned.openingElement.attributes.push(
              babel.jsxAttribute(
                babel.jsxIdentifier("className"),
                babel.stringLiteral(className),
              ),
            );
          }
        }
      }

      cloned.children = this.children.map(
        (child) =>
          child.toModifiedBabelNode() as
            | babel.JSXText
            | babel.JSXExpressionContainer
            | babel.JSXSpreadChild
            | babel.JSXElement
            | babel.JSXFragment,
      );
      return cloned;
    } else if (original.type === "File") {
      const cloned = babel.cloneNode(original, true);

      const childForIndex = new Map<number, BabelNodeType>();
      for (const child of this.children) {
        const index = child.babelNode.loc?.start.index;
        if (index !== undefined) {
          childForIndex.set(index, child.toModifiedBabelNode());
        }
      }

      cloned.program.body = cloned.program.body.map((node) => {
        if (node.loc) {
          const newChild = childForIndex.get(node.loc.start.index);
          if (newChild) {
            return newChild as babel.Statement;
          }
        }
        return node;
      });

      return cloned;
    } else {
      const cloned = babel.cloneNode(original, true);

      const childForIndex = new Map<number, BabelNodeType>();
      for (const child of this.children) {
        const index = child.babelNode.loc?.start.index;
        if (index !== undefined) {
          childForIndex.set(index, child.toModifiedBabelNode());
        }
      }

      // replace inner JSXElement/JSXFragment
      traverse(cloned, {
        JSXElement: (path) => {
          const newChild = childForIndex.get(path.node.loc!.start.index);
          if (newChild) {
            path.replaceWith(newChild);
          }
        },
        JSXFragment: (path) => {
          const newChild = childForIndex.get(path.node.loc!.start.index);
          if (newChild) {
            path.replaceWith(newChild);
          }
        },
        noScope: true,
      });

      return cloned;
    }
  }
}
