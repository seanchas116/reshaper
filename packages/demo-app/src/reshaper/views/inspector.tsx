"use client";

import { useEditorState } from "../state/editor-state";
import { observer } from "mobx-react-lite";
import { JSXAttribute } from "@babel/types";
import path from "path-browserify";

export const Inspector = observer(() => {
  const editorState = useEditorState();
  const node = editorState.selectedNode;
  if (!node) return null;

  const className = node.openingElement.attributes.find(
    (attr): attr is JSXAttribute => {
      return attr.type === "JSXAttribute" && attr.name.name === "className";
    },
  );
  const value = className?.value;
  const stringValue = value?.type === "StringLiteral" ? value.value : undefined;

  return (
    <div className="w-64 border-l border-gray-200 bg-white">
      <div className="p-3 text-xs">
        <div className="mb-2 flex items-center justify-between">
          <h2>
            {node.openingElement.name.type === "JSXIdentifier"
              ? node.openingElement.name.name
              : "Unknown"}
          </h2>
          <div className="font-mono font-[10px] text-gray-400">
            {path.basename(editorState.filePath)}:{node.loc?.start.line}:
            {node.loc?.start.column}
          </div>
        </div>
        <textarea
          className="block h-32 w-full rounded bg-gray-100 p-2 font-mono text-xs"
          value={stringValue}
          readOnly
        />
      </div>
    </div>
  );
});
