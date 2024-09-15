import { Node } from "@/reshaper/models/node";
import { useEditorState } from "@/reshaper/state/editor-state";
import { reaction } from "mobx";
import { useEffect } from "react";
import scrollIntoView from "scroll-into-view-if-needed";

export const elementForNode = new WeakMap<Node, HTMLElement>();

export function useRevealSelectedRow() {
  const editorState = useEditorState();

  useEffect(
    () =>
      reaction(
        () => editorState.workspace.selectedNodes,
        async (nodes) => {
          for (const node of nodes) {
            node.parent?.expandAllAncestors();
          }

          // wait for render
          await new Promise((resolve) => setTimeout(resolve, 0));

          for (const node of nodes) {
            const element = elementForNode.get(node);
            if (element) {
              scrollIntoView(element, { scrollMode: "if-needed" });
            }
          }
        },
      ),
    [editorState],
  );
}
