import { action } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useRef } from "react";
import { twMerge } from "tailwind-merge";
import { Icon } from "@iconify/react";
import { TreeViewItem } from "./tree-view-item";

function ToggleCollapsedButton({
  visible,
  value,
  onChange,
}: {
  visible: boolean;
  value: boolean;
  onChange: (collapsed: boolean) => void;
}) {
  return visible ? (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange(!value);
      }}
      className={twMerge(
        "w-4 h-4 shrink-0 flex items-center justify-center opacity-0 [.treeview-root:hover_&]:opacity-50 transition-opacity",
        !value && "rotate-90"
      )}
    >
      <Icon className="text-xs" icon="material-symbols:chevron-right" />
    </button>
  ) : (
    <div className="w-4 h-4 shrink-0" />
  );
}

export const TreeRow: React.FC<{
  item: TreeViewItem;
  depth: number;
  indentation: number;
}> = observer(({ item, depth, indentation }) => {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseDown = action((event: React.MouseEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    if (event.metaKey) {
      if (item.selected) {
        item.deselect();
      } else {
        item.select();
      }
    } else if (event.shiftKey) {
      TreeViewItem.selectBetween([...item.allSelectedItems, item]);
    } else {
      item.deselectAll();
      item.select();
    }
  });

  const onMouseEnter = action(() => {
    item.enterHover();
  });
  const onMouseLeave = action(() => {
    item.leaveHover();
  });

  const onContextMenu = action((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!item.selected) {
      item.deselectAll();
      item.select();
    }

    item.showContextMenu(e);
  });

  const onCollapsedChange = action((value: boolean) => {
    item.collapsed = value;
  });

  const selected = item.selected;
  const hovered = item.hovered;
  const ancestorSelected = item.ancestorSelected;
  const topSelectionConnected =
    item.prevInTreeView?.ancestorSelected && ancestorSelected;
  const bottomSelectionConnected =
    item.nextInTreeView?.ancestorSelected && ancestorSelected;
  const isInstanceContent = item.isInstanceContent;

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
      className={twMerge(
        "h-8 mx-1 content-visibility-auto contain-strict group",
        !topSelectionConnected && "rounded-t-lg",
        !bottomSelectionConnected && "rounded-b-lg",
        hovered && "ring-1 ring-inset ring-blue-500",
        isInstanceContent && "text-rera-component-text",
        ancestorSelected && "bg-blue-500/10",
        selected && "bg-blue-500 text-white",
        isInstanceContent && selected && "bg-rera-component",
        isInstanceContent && hovered && "ring-rera-component"
      )}
    >
      <div
        className={twMerge(
          "flex items-center h-full pl-1 relative",
          item.dimmed && "opacity-30"
        )}
        style={{
          paddingLeft: `${(depth * indentation) / 16}rem`,
        }}
      >
        <ToggleCollapsedButton
          visible={item.children.length > 0}
          value={item.collapsed}
          onChange={onCollapsedChange}
        />
        {item.renderContent()}
      </div>
    </div>
  );
});
