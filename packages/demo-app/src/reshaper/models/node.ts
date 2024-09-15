import { computed, makeObservable } from "mobx";
import { Workspace } from "./workspace";
import * as babel from "@babel/types";
import { BasicNode } from "../utils/node/basic-node";

export type NodeData = {
  readonly parent?: string;
  readonly order?: string;
  readonly babelNode: babel.Node; // original babel node: do not edit this directly
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
    if (babelNode.type !== "JSXElement") return "";

    const nameNode = babelNode.openingElement.name;
    return nameNode.type === "JSXIdentifier" ? nameNode.name : "";
  }

  get modifiedBabelNode(): babel.Node {
    const babelNode = this.babelNode;
    if (babelNode.type !== "JSXElement") return babelNode;

    // replace className if exists
    const className = this.className;
    if (!className) {
      return babelNode;
    }

    const newAttributes = babelNode.openingElement.attributes.map((attr) => {
      if (attr.type === "JSXAttribute" && attr.name.name === "className") {
        return babel.jsxAttribute(
          babel.jsxIdentifier("className"),
          babel.stringLiteral(className),
        );
      }
      return attr;
    });

    return {
      ...babelNode,
      openingElement: {
        ...babelNode.openingElement,
        attributes: newAttributes,
      },
    };
  }
}
