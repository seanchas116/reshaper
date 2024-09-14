"use client";

import { useEffect, useState } from "react";
import { EditorState, EditorStateProvider } from "./state/editor-state";
import { EditorBody } from "./views/editor-body";

export const Editor = ({ path }: { path: string }) => {
  const [editorState, setEditorState] = useState<EditorState>();

  useEffect(() => {
    const editorState = new EditorState();
    setEditorState(editorState);
  }, []);

  useEffect(() => {
    if (editorState) {
      editorState.pathname = path;
    }
  }, [editorState, path]);

  return (
    editorState && (
      <EditorStateProvider value={editorState}>
        <EditorBody />
      </EditorStateProvider>
    )
  );
};
