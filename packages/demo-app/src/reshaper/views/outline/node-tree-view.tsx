import { observer } from "mobx-react-lite";
import React from "react";
import { useRevealSelectedRow } from "./use-reveal-selected-row";
import { RootTreeViewItem } from "./node-tree-view-item";
import { useEditorState } from "@/reshaper/state/editor-state";
import { TreeView } from "@/reshaper/components/treeview/tree-view";

export const NodeTreeView: React.FC = observer(() => {
  const editorState = useEditorState();

  useRevealSelectedRow();

  return <TreeView rootItem={RootTreeViewItem.get(editorState)} />;
});
