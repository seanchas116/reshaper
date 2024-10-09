"use client";

import { useEditorState } from "../state/editor-state";
import { observer } from "mobx-react-lite";
import path from "path-browserify";

const NodeInspector = observer(() => {
  const editorState = useEditorState();
  const node = editorState.workspace.selectedNodes.at(0);
  if (!node) return null;

  const babelNode = node.babelNode;

  if (babelNode.type === "JSXText") {
    return (
      <div className="p-3 text-xs">
        <textarea
          className="block h-32 w-full rounded bg-gray-100 p-2 font-mono text-xs"
          value={node.text}
          onChange={(e) => {
            node.text = e.target.value;
          }}
        />
      </div>
    );
  }

  if (babelNode.type === "JSXElement") {
    return (
      <div className="p-3 text-xs">
        <div className="mb-2 flex items-center justify-between">
          <h2>
            {babelNode.openingElement.name.type === "JSXIdentifier"
              ? babelNode.openingElement.name.name
              : "Unknown"}
          </h2>
          <div className="font-mono text-[10px] text-gray-400">
            {path.basename(editorState.filePath)}:{babelNode.loc?.start.line}:
            {babelNode.loc?.start.column}
          </div>
        </div>
        <div className="mb-2 font-mono text-[10px] text-gray-400">
          {node.id}
        </div>
        <textarea
          className="block h-32 w-full rounded bg-gray-100 p-2 font-mono text-xs"
          value={node.className}
          onChange={(e) => {
            node.className = e.target.value;
          }}
        />
      </div>
    );
  }
});

export const Inspector = () => {
  return (
    <div className="w-64 border-l border-gray-200 bg-white">
      <NodeInspector />
    </div>
  );
};
