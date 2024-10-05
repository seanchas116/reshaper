"use client";

import { Workspace } from "./models/workspace";

function receiveEdit(workspace: Workspace) {
  console.log("TODO: receive edit...", workspace);
}

window.__reshaperReceiveEdit = receiveEdit;

export const EditReceiver: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  console.log(children);

  return <>{children}</>;
};
