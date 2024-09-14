"use client";

import { useEditorState } from "../state/editor-state";
import { observer } from "mobx-react-lite";
import path from "path-browserify";
import { Node } from "../models/node";

const ASTNodeView = observer(
  ({ node, depth }: { node: Node; depth: number }) => {
    const editorState = useEditorState();

    const babelNode = node.content.node;
    if (babelNode.type !== "JSXElement") return null;

    const nameNode = babelNode.openingElement.name;
    const name = nameNode.type === "JSXIdentifier" ? nameNode.name : "Unknown";
    const selected = editorState.selectedNode === babelNode;

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
          {node.children.map((child) => {
            return (
              <ASTNodeView key={child.id} node={child} depth={depth + 1} />
            );
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
        {editorState.document.rootNodes.map((node) => (
          <ASTNodeView key={node.id} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
});
