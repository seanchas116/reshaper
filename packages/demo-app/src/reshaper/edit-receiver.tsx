"use client";

import React, { useEffect, useState } from "react";
import { RecursiveNodeData } from "./models/node";

if (typeof window !== "undefined") {
  window.__reshaperReceiveEdit = (
    initialNodes: Map<string, RecursiveNodeData>,
    newNodes: Map<string, RecursiveNodeData>,
  ) => {
    for (const listener of editListeners) {
      listener(initialNodes, newNodes);
    }
  };
}

const editListeners = new Set<
  (
    initialNodes: Map<string, RecursiveNodeData>,
    newNodes: Map<string, RecursiveNodeData>,
  ) => void
>();

export const EditReceiver: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [state, setState] = useState<
    | {
        initialNodes: Map<string, RecursiveNodeData>;
        newNodes: Map<string, RecursiveNodeData>;
      }
    | undefined
  >();

  useEffect(() => {
    const onEdit = (
      initialNodes: Map<string, RecursiveNodeData>,
      newNodes: Map<string, RecursiveNodeData>,
    ) => {
      setState({ initialNodes, newNodes });
    };

    editListeners.add(onEdit);
    return () => {
      editListeners.delete(onEdit);
    };
  }, []);

  if (!state) {
    return <>{children}</>;
  }

  const reactNodeIDMap = new Map<string, React.ReactNode>();
  for (const child of React.Children.toArray(children)) {
    if (React.isValidElement(child)) {
      buildReactNodeIDMap(reactNodeIDMap, child, state.initialNodes);
    }
  }

  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const reshaperLoc = child.props["data-reshaper-loc"];
          if (reshaperLoc) {
            return applyChanges(
              child,
              state.initialNodes,
              state.newNodes,
              reactNodeIDMap,
            );
          }
        }
        return child;
      })}
    </>
  );
};

function buildReactNodeIDMap(
  result: Map<string, React.ReactNode>,
  node: React.ReactElement,
  initialNodes: Map<string, RecursiveNodeData>,
) {
  const id = node.props["data-reshaper-loc"] as string | undefined;
  if (id) {
    result.set(id, node);
  }
  const reshaperNode = id ? initialNodes.get(id) : undefined;

  for (const [i, child] of React.Children.toArray(
    node.props.children,
  ).entries()) {
    if (React.isValidElement(child)) {
      buildReactNodeIDMap(result, child, initialNodes);
    } else {
      const predictedID = reshaperNode?.children[i].id;
      if (predictedID) {
        result.set(predictedID, child);
      }
    }
  }
}

function applyChanges(
  reactNode: React.ReactElement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initialNodes: Map<string, RecursiveNodeData>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  newNodes: Map<string, RecursiveNodeData>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reactNodeIDMap: Map<string, React.ReactNode>,
) {
  console.log(reactNodeIDMap);
  // TODO
  return reactNode;
}
