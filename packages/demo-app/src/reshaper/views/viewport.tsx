"use client";

import { useEditorState } from "../state/editor-state";
import { observer } from "mobx-react-lite";
import { action } from "mobx";

export const Viewport = observer(() => {
  const editorState = useEditorState();
  const viewportState = editorState.viewportState;

  return (
    <div className="grid bg-gray-100 p-4">
      <div className="relative bg-white shadow">
        <iframe
          src={editorState.pathname}
          className="absolute h-full w-full"
          onLoad={action((e) => {
            editorState.viewportState.setIFrame(e.currentTarget);
          })}
        />
        <div className="absolute h-full w-full">
          {[
            ...viewportState.hoveredBoundingBoxes,
            ...viewportState.selectedBoundingBoxes,
          ].map((rect, i) => (
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
          ))}
        </div>
        <div
          className="absolute h-full w-full"
          onMouseMove={action((e) => {
            const node = viewportState.locateNode(e.clientX, e.clientY)?.node;
            editorState.hoveredNodeID = node?.id;
          })}
          onClick={action((e) => {
            editorState.viewportState.revealPoint(e.clientX, e.clientY);
          })}
        />
      </div>
    </div>
  );
});
