import { describe, expect, it } from "vitest";
import { Workspace } from "./workspace";
import { parse } from "@babel/parser";
import fs from "fs";

describe(Workspace.name, () => {
  it("loads project", () => {
    const workspace = new Workspace();

    const code = fs.readFileSync("src/app/page.tsx", "utf-8");

    const ast = parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });

    const file = workspace.loadFileAST("index.tsx", code, ast);
    expect(file.node.toRecursiveData()).toMatchSnapshot();
  });
});
