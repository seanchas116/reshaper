"use client";

import { useEditorState } from "../state/editor-state";
import { observer } from "mobx-react-lite";

export const NavBar = observer(() => {
  const editorState = useEditorState();

  return (
    <div className="flex h-10 items-center justify-center border-b border-gray-200 bg-white">
      <div className="w-[320px] rounded bg-gray-100 px-3 py-1 text-sm text-gray-500">
        {window.location.origin}
        {editorState.pathname}
      </div>
    </div>
  );
});
