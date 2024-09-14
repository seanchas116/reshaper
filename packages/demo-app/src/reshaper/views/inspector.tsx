"use client";

import { useEditorState } from "../state/editor-state";
import { observer } from "mobx-react-lite";
import { JSXAttribute } from "@babel/types";
import path from "path-browserify";

const NodeInspector = observer(() => {
  const editorState = useEditorState();
  const node = editorState.workspace.selectedNodes.at(0);
  if (!node) return null;

  const babelNode = node.babelNode;
  if (babelNode.type !== "JSXElement") return null;

  const className = babelNode.openingElement.attributes.find(
    (attr): attr is JSXAttribute => {
      return attr.type === "JSXAttribute" && attr.name.name === "className";
    },
  );
  const value = className?.value;
  const stringValue = value?.type === "StringLiteral" ? value.value : undefined;

  return (
    <div className="p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <h2>
          {babelNode.openingElement.name.type === "JSXIdentifier"
            ? babelNode.openingElement.name.name
            : "Unknown"}
        </h2>
        <div className="font-mono font-[10px] text-gray-400">
          {path.basename(editorState.filePath)}:{babelNode.loc?.start.line}:
          {babelNode.loc?.start.column}
        </div>
      </div>
      <textarea
        className="block h-32 w-full rounded bg-gray-100 p-2 font-mono text-xs"
        value={stringValue}
        readOnly
      />
    </div>
  );
});

export const Inspector = () => {
  return (
    <div className="w-64 border-l border-gray-200 bg-white">
      <NodeInspector />
    </div>
  );
};
