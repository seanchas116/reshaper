import { Node } from "./node";
import { describe, expect, it } from "vitest";
import { Workspace } from "./workspace";

describe(Node.name, () => {
  it("should handle basic tree operations", () => {
    const workspace = new Workspace();
    const node = workspace.nodes.add("1", {
      order: 0,
      babelNode: {} as any,
    });
    const child1 = workspace.nodes.add("2", {
      order: 0,
      babelNode: {} as any,
    });
    const child2 = workspace.nodes.add("3", {
      order: 0,
      babelNode: {} as any,
    });

    node.insertBefore([child1, child2], undefined);
    expectIdsEqual(node.children, [child1, child2]);
    expect(child1.parent).toBe(node);
    expect(child2.parent).toBe(node);
    expect(child1.index).toBe(0);
    expect(child2.index).toBe(1);
    // expect(node.firstChild).toBe(child1);
    // expect(node.lastChild).toBe(child2);
    expect(child1.nextSibling).toBe(child2);
    expect(child2.previousSibling).toBe(child1);
    expect(node.ancestors).toEqual([]);
    expectIdsEqual(child1.ancestors, [node]);
    expectIdsEqual(child2.ancestors, [node]);
    expect(node.siblings).toEqual([]);
    expectIdsEqual(child1.siblings, [child1, child2]);
    expectIdsEqual(child2.siblings, [child1, child2]);
    expect(node.includes(child1)).toBe(true);
    expect(node.includes(child2)).toBe(true);
    expect(child1.includes(node)).toBe(false);
    expect(child1.includes(child2)).toBe(false);
    expect(node.indexPath).toEqual([]);
    expect(child1.indexPath).toEqual([0]);
    expect(child2.indexPath).toEqual([1]);
  });
});

function expectIdsEqual(a: Node[], b: Node[]) {
  expect(a.map((node) => node.id)).toEqual(b.map((node) => node.id));
}
