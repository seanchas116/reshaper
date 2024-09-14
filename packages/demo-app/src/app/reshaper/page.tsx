"use client";

import { useEffect, useRef, useState } from "react";
import { EditorState, EditorStateProvider, useEditorState } from "./state";
import { observer } from "mobx-react-lite";
import { File, JSXAttribute, JSXElement } from "@babel/types";
import traverse from "@babel/traverse";
import path from "path-browserify";
import { Rect } from "paintvec";
import { action } from "mobx";

export function findJSXElements(file: File): JSXElement[] {
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
          className="h-6 flex items-center aria-selected:bg-blue-500 aria-selected:text-white"
          aria-selected={selected}
          style={{
            paddingLeft: depth * 8 + 12,
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
  }
);

const ASTViewer = observer(() => {
  const editorState = useEditorState();
  return (
    <div className="size-full flex-1 relative">
      <div className="absolute inset-0 size-full overflow-y-scroll text-xs">
        <div className="px-3 py-2 text-gray-400 font-bold">
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

const Inspector = observer(() => {
  const editorState = useEditorState();
  const node = editorState.selectedNode;
  if (!node) return null;

  const className = node.openingElement.attributes.find(
    (attr): attr is JSXAttribute => {
      return attr.type === "JSXAttribute" && attr.name.name === "className";
    }
  );
  const value = className?.value;
  const stringValue = value?.type === "StringLiteral" ? value.value : undefined;

  return (
    <div className="p-3 text-xs">
      <div className="mb-2 flex justify-between items-center">
        <h2>
          {node.openingElement.name.type === "JSXIdentifier"
            ? node.openingElement.name.name
            : "Unknown"}
        </h2>
        <div className="font-mono text-gray-400 font-[10px]">
          {path.basename(editorState.filePath)}:{node.loc?.start.line}:
          {node.loc?.start.column}
        </div>
      </div>
      <textarea
        className="block w-full h-32 bg-gray-100 rounded p-2 text-xs font-mono"
        value={stringValue}
        readOnly
      />
    </div>
  );
});

const Editor = observer(() => {
  const editorState = useEditorState();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="grid grid-rows-[auto_1fr] w-screen h-screen fixed inset-0">
      <div className="h-10 border-b bg-white border-gray-200 flex items-center justify-center">
        <div className="bg-gray-100 w-[320px] rounded text-gray-500 px-3 py-1 text-sm">
          http://localhost:3000
        </div>
      </div>
      <div className="grid grid-cols-[auto_1fr_auto]">
        <div className="w-64 bg-white border-r border-gray-200">
          <ASTViewer />
        </div>
        <div className="grid p-4 bg-gray-100">
          <div className="relative bg-white shadow">
            <iframe
              src="/"
              className="absolute w-full h-full"
              ref={iframeRef}
            ></iframe>
            <div className="absolute w-full h-full">
              {editorState.hoveredRect && (
                <div
                  className="absolute border border-blue-500"
                  style={{
                    left: editorState.hoveredRect.left,
                    top: editorState.hoveredRect.top,
                    width: editorState.hoveredRect.width,
                    height: editorState.hoveredRect.height,
                  }}
                />
              )}
            </div>
            <div
              className="absolute w-full h-full"
              onMouseMove={action((e) => {
                // find the element that was clicked
                const iframe = iframeRef.current;
                if (!iframe) return;

                editorState.hoveredRect = undefined;

                const elem = iframe.contentDocument?.elementFromPoint(
                  e.clientX - iframe.getBoundingClientRect().left,
                  e.clientY - iframe.getBoundingClientRect().top
                );
                if (!elem) return;

                const location = elem.getAttribute("data-reshaper-loc");
                if (!location) {
                  return;
                }

                editorState.hoveredRect = Rect.from(
                  elem.getBoundingClientRect()
                );
              })}
              onClick={action((e) => {
                // find the element that was clicked
                const iframe = iframeRef.current;
                if (!iframe) return;

                editorState.hoveredRect = undefined;

                const elem = iframe.contentDocument?.elementFromPoint(
                  e.clientX - iframe.getBoundingClientRect().left,
                  e.clientY - iframe.getBoundingClientRect().top
                );
                if (!elem) return;

                const location = elem.getAttribute("data-reshaper-loc");
                if (!location) {
                  return;
                }

                const [filePath, line, col] = location.split(":");
                editorState.revealLocation(filePath, +line, +col);
              })}
            />
          </div>
        </div>
        <div className="w-64 bg-white border-l border-gray-200">
          <Inspector />
        </div>
      </div>
    </div>
  );
});

const Page = () => {
  const [editorState, setEditorState] = useState<EditorState>();

  useEffect(() => {
    const editorState = new EditorState();
    setEditorState(editorState);
  }, []);

  return (
    editorState && (
      <EditorStateProvider value={editorState}>
        <Editor />
      </EditorStateProvider>
    )
  );
};

export default Page;
