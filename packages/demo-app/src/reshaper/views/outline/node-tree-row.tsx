import { Icon } from "@iconify/react";
import { observer } from "mobx-react-lite";
import React from "react";
import { elementForNode } from "./use-reveal-selected-row";
import { NodeTreeViewItem } from "./node-tree-view-item";
import { Node } from "@/reshaper/models/node";

export const NodeIcon: React.FC<{
  node: Node;
  selected?: boolean;
}> = observer(({ node }) => {
  switch (node.babelNode.type) {
    case "File":
      return null;
    case "JSXElement":
    case "JSXFragment":
      return (
        <Icon className="opacity-70" icon="material-symbols:code-rounded" />
      );
    case "JSXText":
      <Icon
        className="opacity-70"
        icon="material-symbols:data-object-rounded"
      />;
  }
});

NodeIcon.displayName = "NodeIcon";

export const NodeTreeRow: React.FC<{
  item: NodeTreeViewItem;
}> = observer(({ item }) => {
  const node = item.node;

  return (
    <div
      ref={(element) => {
        if (element) {
          elementForNode.set(node, element);
        }
      }}
      className="flex h-full min-w-0 flex-1 items-center"
    >
      <span className="mr-2 rounded-full p-1">
        <NodeIcon node={node} selected={node.selected} />
      </span>
      {node.name}
      {/* <ClickToEdit
        className="h-full min-w-0 flex-1 truncate"
        inputClassName="bg-white text-gray-800 outline-0 h-full w-full focus:ring-1 focus:ring-inset focus:ring-blue-500 rounded-r-lg"
        previewClassName="h-full w-full min-w-0 flex items-center truncate"
        editing={isNameEditing}
        onChangeEditing={setNameEditing}
        value={node.name}
        onChangeValue={action((value) => {
          node.name = value;
        })}
      /> */}
    </div>
  );
});

NodeTreeRow.displayName = "ElementTreeRow";
