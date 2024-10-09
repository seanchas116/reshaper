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
          const id = child.props["data-reshaper-loc"];
          if (id) {
            return applyChanges(
              id,
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
  idToReactNode: Map<string, React.ReactNode>,
  node: React.ReactElement,
  initialNodes: Map<string, RecursiveNodeData>,
) {
  const id = node.props["data-reshaper-loc"] as string | undefined;
  if (id) {
    idToReactNode.set(id, node);
  }
  const reshaperNode = id ? initialNodes.get(id) : undefined;

  for (const [i, child] of React.Children.toArray(
    node.props.children,
  ).entries()) {
    if (React.isValidElement(child)) {
      buildReactNodeIDMap(idToReactNode, child, initialNodes);
    } else {
      const predictedID = reshaperNode?.children[i].id;
      if (predictedID) {
        idToReactNode.set(predictedID, child);
      }
    }
  }
}

function applyChanges(
  id: string | undefined,
  reactNode: React.ReactElement,
  idToInitialNode: Map<string, RecursiveNodeData>,
  idToNode: Map<string, RecursiveNodeData>,
  idToReactNode: Map<string, React.ReactNode>,
) {
  if (!id) {
    return reactNode;
  }

  const initialNode = idToInitialNode.get(id);
  const node = idToNode.get(id);

  if (!initialNode || !node) {
    return reactNode;
  }

  const newReactChildren: React.ReactNode[] = [];

  for (const child of node.children) {
    const childReactNode = idToReactNode.get(child.id);

    if (React.isValidElement(childReactNode)) {
      newReactChildren.push(
        applyChanges(
          child.id,
          childReactNode,
          idToInitialNode,
          idToNode,
          idToReactNode,
        ),
      );
    } else {
      newReactChildren.push(childReactNode);
    }
  }

  return React.cloneElement(reactNode, {}, newReactChildren);
}
