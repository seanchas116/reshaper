import { observer } from "mobx-react-lite";
import React from "react";
import { useRevealSelectedRow } from "./use-reveal-selected-row";
import { useEditorState } from "@/reshaper/state/editor-state";
import { TreeView } from "@/reshaper/components/treeview/tree-view";
import { NodeTreeViewItem } from "./node-tree-view-item";

export const NodeTreeView: React.FC = observer(() => {
  const editorState = useEditorState();

  useRevealSelectedRow();

  const rootNode = editorState.fileNode;
  if (!rootNode) return null;

  return <TreeView rootItem={NodeTreeViewItem.get(editorState, rootNode)} />;
});
