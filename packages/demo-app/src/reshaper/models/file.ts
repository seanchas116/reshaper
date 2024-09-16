import traverse, { NodePath } from "@babel/traverse";
import { BabelNodeType, Node } from "./node";
import { Workspace } from "./workspace";
import * as babel from "@babel/types";

function locationID(filePath: string, location: babel.SourceLocation) {
  return `${filePath}:${location.start.line}:${location.start.column}`;
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

export class File {
  readonly workspace: Workspace;
  readonly filePath: string;
  readonly node: Node;
  readonly babelNode: babel.File;

  delete() {
    this.node.delete();
  }

  constructor(workspace: Workspace, filePath: string, babelNode: babel.File) {
    this.workspace = workspace;
    this.filePath = filePath;
    this.babelNode = babelNode;

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

    const toplevelStatementNodes = this.babelNode.program.body.map(
      (statement) => {
        return this.workspace.nodes.add(
          locationID(this.filePath, statement.loc!),
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
        const node = this.workspace.nodes.add(
          locationID(this.filePath, path.node.loc!),
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

        const node = this.workspace.nodes.add(
          locationID(this.filePath, path.node.loc!),
          {
            babelNode: path.node,
          },
        );

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

    this.node = this.workspace.nodes.add(this.filePath, {
      babelNode: this.babelNode,
    });
    this.node.append(
      toplevelStatementNodes.filter((node) => node.children.length > 0),
    );
  }
}
