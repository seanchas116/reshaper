"use client";

import { useRef } from "react";
import { useEditorState } from "../state/editor-state";
import { observer } from "mobx-react-lite";
import { Rect } from "paintvec";
import { action } from "mobx";

export const Viewport = observer(() => {
  const editorState = useEditorState();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="grid bg-gray-100 p-4">
      <div className="relative bg-white shadow">
        <iframe
          src={editorState.pathname}
          className="absolute h-full w-full"
          ref={iframeRef}
        />
        <div className="absolute h-full w-full">
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
          className="absolute h-full w-full"
          onMouseMove={action((e) => {
            // find the element that was clicked
            const iframe = iframeRef.current;
            if (!iframe) return;

            editorState.hoveredRect = undefined;

            const elem = iframe.contentDocument?.elementFromPoint(
              e.clientX - iframe.getBoundingClientRect().left,
              e.clientY - iframe.getBoundingClientRect().top,
            );
            if (!elem) return;

            const location = elem.getAttribute("data-reshaper-loc");
            if (!location) {
              return;
            }

            editorState.hoveredRect = Rect.from(elem.getBoundingClientRect());
          })}
          onClick={action((e) => {
            // find the element that was clicked
            const iframe = iframeRef.current;
            if (!iframe) return;

            editorState.hoveredRect = undefined;

            const elem = iframe.contentDocument?.elementFromPoint(
              e.clientX - iframe.getBoundingClientRect().left,
              e.clientY - iframe.getBoundingClientRect().top,
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
  );
});
