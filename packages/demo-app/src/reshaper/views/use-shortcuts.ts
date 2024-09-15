import { useHotkeys } from "react-hotkeys-hook";
import { action } from "mobx";
import { useEditorState } from "../state/editor-state";

export function useShortcuts() {
  const editorState = useEditorState();

  useHotkeys(
    ["ctrl+z", "meta+z"],
    action(() => {
      editorState.workspace.undoManager.undo();
    }),
    { preventDefault: true },
  );

  useHotkeys(
    ["ctrl+y", "shift+meta+z"],
    action(() => {
      editorState.workspace.undoManager.redo();
    }),
    { preventDefault: true },
  );
}
