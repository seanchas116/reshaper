"use client";

import React, { useEffect } from "react";
import type { Workspace } from "./models/workspace";
import { RecursiveNodeData } from "./models/node";

if (typeof window !== "undefined") {
  window.__reshaperReceiveEdit = (
    initialStructures: Map<string, RecursiveNodeData>,
    newStructures: Map<string, RecursiveNodeData>,
  ) => {
    for (const listener of editListeners) {
      listener(initialStructures, newStructures);
    }
  };
}

const editListeners = new Set<
  (
    initialStructures: Map<string, RecursiveNodeData>,
    newStructures: Map<string, RecursiveNodeData>,
  ) => void
>();

export const EditReceiver: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [workspace, setWorkspace] = React.useState<Workspace | undefined>();

  useEffect(() => {
    const onEdit = (
      initialStructures: Map<string, RecursiveNodeData>,
      newStructures: Map<string, RecursiveNodeData>,
    ) => {
      console.log("received edit", initialStructures, newStructures);
      setWorkspace(workspace);
    };

    editListeners.add(onEdit);
    return () => {
      editListeners.delete(onEdit);
    };
  }, []);

  if (!workspace) {
    return <>{children}</>;
  }

  for (const child of React.Children.toArray(children)) {
    console.log(child);
    if (React.isValidElement(child)) {
      const reshaperLoc = child.props["data-reshaper-loc"];
      if (reshaperLoc) {
        // TODO: find Node by reshaperLoc and apply changes
      }
    }
  }

  return <>{children}</>;
};
