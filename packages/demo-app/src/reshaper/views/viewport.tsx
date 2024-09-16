"use client";

import { useRef, useState } from "react";
import { useEditorState } from "../state/editor-state";
import { observer } from "mobx-react-lite";
import { Rect } from "paintvec";
import { action } from "mobx";
import { Node } from "../models/node";

export const Viewport = observer(() => {
  const editorState = useEditorState();
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);

  const getBoundingBoxes = (node: Node): Rect[] => {
    if (!iframe?.contentDocument) return [];

    const elementIndex = editorState.file?.elementIndexForNode.get(node);
    if (elementIndex === undefined) return [];

    const fileName = editorState.filePath;
    const selector = `[data-reshaper-loc="${fileName}:${elementIndex}"]`;

    const elements = iframe.contentDocument.querySelectorAll(selector);
    const boundingBoxes: Rect[] = [];
    for (const elem of elements) {
      boundingBoxes.push(Rect.from(elem.getBoundingClientRect()));
    }

    return boundingBoxes;
  };

  const hoveredNode = editorState.hoveredNode;
  const hoveredBoundingBoxes = hoveredNode ? getBoundingBoxes(hoveredNode) : [];

  const selectedBoundingBoxes =
    editorState.workspace.selectedNodes.flatMap(getBoundingBoxes);

  return (
    <div className="grid bg-gray-100 p-4">
      <div className="relative bg-white shadow">
        <iframe
          src={editorState.pathname}
          className="absolute h-full w-full"
          onLoad={(e) => {
            setIframe(e.currentTarget);
          }}
        />
        <div className="absolute h-full w-full">
          {[...hoveredBoundingBoxes, ...selectedBoundingBoxes].map(
            (rect, i) => (
              <div
                key={i}
                className="absolute border border-blue-500"
                style={{
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                }}
              />
            ),
          )}
        </div>
        <div
          className="absolute h-full w-full"
          onMouseMove={action((e) => {
            // find the element that was clicked
            if (!iframe) return;

            editorState.hoveredNodeID = undefined;

            const elem = iframe.contentDocument?.elementFromPoint(
              e.clientX - iframe.getBoundingClientRect().left,
              e.clientY - iframe.getBoundingClientRect().top,
            );
            if (!elem) return;

            const location = elem.getAttribute("data-reshaper-loc");
            if (!location) {
              return;
            }
            const [filePath, elemIndex] = location.split(":");

            const node = editorState.workspace.nodeForLocation(
              filePath,
              +elemIndex,
            );
            editorState.hoveredNodeID = node?.id;
          })}
          onClick={action((e) => {
            // find the element that was clicked
            if (!iframe) return;

            const elem = iframe.contentDocument?.elementFromPoint(
              e.clientX - iframe.getBoundingClientRect().left,
              e.clientY - iframe.getBoundingClientRect().top,
            );
            if (!elem) return;

            const location = elem.getAttribute("data-reshaper-loc");
            if (!location) {
              return;
            }

            const [filePath, elemIndex] = location.split(":");
            editorState.revealLocation(filePath, +elemIndex);
          })}
        />
      </div>
    </div>
  );
});
