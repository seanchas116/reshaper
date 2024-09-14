import { describe, expect, it } from "vitest";
import { Parenting } from "./parenting";
import { Store } from "./store";

describe(Parenting, () => {
  it("manages parent/child relationships", () => {
    const store = new Store<
      string,
      {
        parent?: string;
        order: number;
        name: string;
      }
    >();
    const parenting = new Parenting(
      store,
      (data) => data.parent,
      (data) => data.order,
    );

    // generate example data

    const a = { parent: undefined, order: 0, name: "a" };
    const b = { parent: "a", order: 1, name: "b" };
    const c = { parent: "a", order: 2, name: "c" };

    store.data.set("a", a);
    store.data.set("b", b);
    store.data.set("c", c);

    expect(parenting.getChildren("a").items).toEqual(["b", "c"]);

    store.data.delete("b");

    expect(parenting.getChildren("a").items).toEqual(["c"]);
  });

  it("loads initial data", () => {
    const store = new Store<
      string,
      {
        parent?: string;
        order: number;
        name: string;
      }
    >();

    const a = { parent: undefined, order: 0, name: "a" };
    const b = { parent: "a", order: 1, name: "b" };
    store.data.set("a", a);
    store.data.set("b", b);

    const parenting = new Parenting(
      store,
      (data) => data.parent,
      (data) => data.order,
    );

    // generate example data

    const c = { parent: "a", order: 2, name: "c" };
    store.data.set("c", c);

    expect(parenting.getChildren("a").items).toEqual(["b", "c"]);
    expect(parenting.getChildren("a").indices).toEqual(
      new Map([
        ["b", 0],
        ["c", 1],
      ]),
    );
  });
});
