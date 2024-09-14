import { describe, expect, it } from "vitest";
import { Store } from "./store";
import { UndoManager } from "./undo-manager";

describe(UndoManager, () => {
  it("undo/redo", () => {
    const users = new Store<
      string,
      {
        firstName: string;
        lastName: string;
      }
    >();
    const documents = new Store<
      string,
      {
        title: string;
      }
    >();

    users.data.set("1", { firstName: "Jane", lastName: "Doe" });
    documents.data.set("1", { title: "Original" });
    documents.data.set("2", { title: "World" });

    const undoManager = new UndoManager([users, documents]);

    users.data.set("1", { firstName: "John", lastName: "Doe" });
    users.data.set("2", { firstName: "Alice", lastName: "Smith" });
    documents.data.set("1", { title: "Hello" });
    documents.data.delete("2");

    expect(users.data.toJSON()).toEqual([
      ["1", { firstName: "John", lastName: "Doe" }],
      ["2", { firstName: "Alice", lastName: "Smith" }],
    ]);
    expect(documents.data.toJSON()).toEqual([["1", { title: "Hello" }]]);

    undoManager.undo();

    expect(users.data.toJSON()).toEqual([
      ["1", { firstName: "Jane", lastName: "Doe" }],
    ]);
    expect(documents.data.toJSON()).toEqual([
      ["1", { title: "Original" }],
      ["2", { title: "World" }],
    ]);
  });
});
