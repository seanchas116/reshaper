"use client";

import { useEditorState } from "../state/editor-state";
import { observer } from "mobx-react-lite";
import { File, JSXElement } from "@babel/types";
import traverse from "@babel/traverse";
import path from "path-browserify";

function findJSXElements(file: File): JSXElement[] {
  const jsxElements: JSXElement[] = [];

  // Traverse the AST to find JSXElement nodes
  traverse(file, {
    JSXElement: (path) => {
      if (!path.findParent((parent) => parent.isJSXElement())) {
        jsxElements.push(path.node); // Collect root JSXElement nodes
      }
    },
  });

  return jsxElements;
}

const ASTNodeView = observer(
  ({ node, depth }: { node: JSXElement; depth: number }) => {
    const editorState = useEditorState();

    const nameNode = node.openingElement.name;
    const name = nameNode.type === "JSXIdentifier" ? nameNode.name : "Unknown";
    const selected = editorState.selectedNode === node;

    return (
      <div>
        <div
          className="mx-1 flex h-7 items-center rounded aria-selected:bg-blue-500 aria-selected:text-white"
          aria-selected={selected}
          style={{
            paddingLeft: depth * 8 + 8,
          }}
        >
          {name}
        </div>
        <div>
          {node.children.map((child, i) => {
            if (child.type === "JSXElement") {
              return <ASTNodeView key={i} node={child} depth={depth + 1} />;
            }
          })}
        </div>
      </div>
    );
  },
);

export const Outline = observer(() => {
  const editorState = useEditorState();
  return (
    <div className="relative w-64 border-r border-gray-200 bg-white">
      <div className="absolute inset-0 size-full overflow-y-scroll text-xs">
        <div className="px-3 py-2 text-gray-400">
          {path.basename(editorState.filePath)}
        </div>
        {editorState.ast &&
          findJSXElements(editorState.ast).map((element, i) => (
            <ASTNodeView key={i} node={element} depth={0} />
          ))}
      </div>
    </div>
  );
});
