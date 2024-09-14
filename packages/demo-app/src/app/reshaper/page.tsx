"use client";

import { useEffect, useRef, useState } from "react";
import { EditorState, EditorStateProvider, useEditorState } from "./state";
import { observer } from "mobx-react-lite";
import { File, JSXElement } from "@babel/types";
import traverse from "@babel/traverse";
import path from "path-browserify";

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

    const selected =
      editorState.line === node.loc?.start.line &&
      editorState.col === node.loc?.start.column;

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
            <div
              className="absolute w-full h-full"
              onClick={(e) => {
                // find the element that was clicked
                const iframe = iframeRef.current;
                if (!iframe) return;

                const elem = iframe.contentDocument?.elementFromPoint(
                  e.clientX - iframe.getBoundingClientRect().left,
                  e.clientY - iframe.getBoundingClientRect().top
                );

                const location = elem?.getAttribute("data-reshaper-loc");
                if (location) {
                  const [filePath, line, col] = location.split(":");
                  editorState.revealLocation(filePath, +line, +col);
                }
              }}
            />
          </div>
        </div>
        <div className="w-64 bg-white border-l border-gray-200"></div>
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
