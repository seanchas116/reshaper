"use client";

import React, { useEffect } from "react";
import type { Workspace } from "./models/workspace";

if (typeof window !== "undefined") {
  window.__reshaperReceiveEdit = (workspace: Workspace) => {
    for (const listener of editListeners) {
      listener(workspace);
    }
  };
}

const editListeners = new Set<(workspace: Workspace) => void>();

export const EditReceiver: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [workspace, setWorkspace] = React.useState<Workspace | undefined>();

  useEffect(() => {
    const onEdit = (workspace: Workspace) => {
      console.log("received edit", workspace);
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
