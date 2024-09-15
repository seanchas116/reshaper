import { action } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { TreeViewItem } from "./tree-view-item";
import { TreeRow } from "./tree-row";

const DropArea: React.FC<{
  parent: TreeViewItem;
  next?: TreeViewItem;
  className?: string;
  style?: React.CSSProperties;
  setDragging: (value: boolean) => void;
  children?: React.ReactNode;
}> = observer(function DropArea({
  parent,
  next,
  className,
  style,
  setDragging,
  children,
}) {
  const [visible, setVisible] = React.useState(false);

  const onDragEnter = () => {
    setVisible(true);
  };
  const onDragLeave = () => {
    setVisible(false);
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    setVisible(true);
    if (event.dataTransfer.types.includes(nodeDragMime)) {
      const shouldCopy = event.altKey;
      if (shouldCopy) {
        event.dataTransfer.dropEffect = "copy";
      } else {
        event.dataTransfer.dropEffect = "move";
      }
      event.preventDefault();
    }
  };

  const onDrop = action((event: React.DragEvent<HTMLDivElement>) => {
    setVisible(false);
    setDragging(false);
    if (event.dataTransfer.types.includes(nodeDragMime)) {
      event.preventDefault();
      parent.drop(next, event.altKey);
    }
  });

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={
        "hidden group-[.is-dragging]/treeview:block " + (className ?? "")
      }
      style={{ opacity: visible ? 1 : 0, ...style }}
    >
      {children}
    </div>
  );
});

const ToChildrenDropArea: React.FC<{
  item: TreeViewItem;
  setDragging: (value: boolean) => void;
}> = observer(function ToChildrenDropArea({ item, setDragging }) {
  return (
    <DropArea
      className="absolute inset-x-1 inset-y-0 border-2 border-blue-500 rounded-lg"
      parent={item}
      setDragging={setDragging}
    />
  );
});

const DropBarOval = () => {
  return (
    <div className="absolute left-[-6px] top-[-5px] w-3 h-3 bg-white rounded-full border-2 border-blue-500" />
  );
};

const PrependDropArea: React.FC<{
  item: TreeViewItem;
  offset: number;
  setDragging: (value: boolean) => void;
}> = observer(function PrependDropArea({ item, offset, setDragging }) {
  const parent = item.parent;
  if (!parent) {
    return null;
  }

  return (
    <DropArea
      className="absolute left-0 -top-2 h-4 right-0 z-10"
      parent={parent}
      next={item}
      setDragging={setDragging}
    >
      <div
        className="absolute inset-0 h-[2px] my-auto bg-blue-500"
        style={{ left: `${offset}px` }}
      >
        <DropBarOval />
      </div>
    </DropArea>
  );
});

const AppendDropArea: React.FC<{
  item: TreeViewItem;
  offset: number;
  setDragging: (value: boolean) => void;
}> = observer(function AppendDropArea({ item, offset, setDragging }) {
  const parent = item.parent;
  if (!parent) {
    return null;
  }
  return (
    <DropArea
      className="absolute left-0 -bottom-2 h-4 right-0 z-20"
      parent={parent}
      next={item.nextSibling}
      style={{ left: `${offset}px` }}
      setDragging={setDragging}
    >
      <div className="absolute inset-0 h-[2px] my-auto bg-blue-500">
        <DropBarOval />
      </div>
    </DropArea>
  );
});

const nodeDragMime = "application/vnd.rera.node";

const DraggableRow: React.FC<{
  item: TreeViewItem;
  depth: number;
  indentation: number;
  setDragging: (dragging: boolean) => void;
}> = observer(({ item, depth, indentation, setDragging }) => {
  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData(nodeDragMime, "true");
    setDragging(true);
  };

  const onDragEnd = () => {
    setDragging(false);
  };

  return (
    <div
      draggable={item.draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="relative"
    >
      <TreeRow item={item} depth={depth} indentation={indentation} />
      {item.droppable && (
        <ToChildrenDropArea item={item} setDragging={setDragging} />
      )}
    </div>
  );
});

const Subtree: React.FC<{
  item: TreeViewItem;
  depth: number;
  setDragging: (dragging: boolean) => void;
}> = observer(({ item, depth, setDragging }) => {
  return (
    <div className="relative">
      <PrependDropArea
        offset={depth * 16 + 16}
        item={item}
        setDragging={setDragging}
      />
      <AppendDropArea
        offset={depth * 16 + 16}
        item={item}
        setDragging={setDragging}
      />
      <DraggableRow
        item={item}
        depth={depth}
        indentation={16}
        setDragging={setDragging}
      />
      {!item.collapsed &&
        item.children.map((child) => (
          <Subtree
            key={child.id}
            item={child}
            depth={depth + 1}
            setDragging={setDragging}
          />
        ))}
    </div>
  );
});

export const TreeView: React.FC<{
  rootItem: TreeViewItem;
}> = observer(({ rootItem }) => {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={
        "min-h-full treeview-root group/treeview relative" +
        (dragging ? " is-dragging" : "")
      }
    >
      <div
        className="absolute inset-0"
        onClick={action(() => {
          rootItem.deselect();
        })}
        onContextMenu={action((e) => {
          rootItem.showContextMenu(e);
        })}
      />
      <DropArea
        className="absolute inset-0"
        parent={rootItem}
        next={undefined}
        setDragging={setDragging}
      />
      <div className="w-full h-1" />
      {rootItem.children.map((child) => (
        <Subtree
          key={child.id}
          item={child}
          depth={0}
          setDragging={setDragging}
        />
      ))}
      <div className="w-full h-1" />
    </div>
  );
});
