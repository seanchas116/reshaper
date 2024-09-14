import { createContext, useContext } from "react";
import { loadFile } from "../actions/actions";
import { makeObservable, observable } from "mobx";
import { parse } from "@babel/parser";
import { File, JSXElement } from "@babel/types";
import traverse from "@babel/traverse";
import { Rect } from "paintvec";
import { Workspace } from "../models/workspace";

export class EditorState {
  constructor() {
    this.filePath = "";
    this.content = "";
    makeObservable(this, {
      filePath: observable,
      line: observable,
      col: observable,
      content: observable,
      ast: observable.ref,
      selectedNode: observable.ref,
      hoveredRect: observable.ref,
    });
  }

  readonly workspace = new Workspace();

  filePath: string = "";
  pathname: string = "";
  line: number = 0;
  col: number = 0;
  content: string = "";
  ast: File | undefined = undefined;
  selectedNode: JSXElement | undefined = undefined;
  hoveredRect: Rect | undefined = undefined;

  async loadFile(filePath: string, line: number, col: number) {
    if (this.filePath !== filePath) {
      const file = await loadFile(filePath);
      this.filePath = filePath;

      const ast = parse(file, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      });

      this.workspace.loadFileAST(ast);

      console.log(ast);
      this.ast = ast;
    }
    this.line = line;
    this.col = col;

    if (this.ast) {
      traverse(this.ast, {
        JSXElement: (path) => {
          if (
            path.node.loc?.start.line === line &&
            path.node.loc?.start.column === col
          ) {
            this.selectedNode = path.node;
          }
        },
      });
    }
  }

  async revealLocation(filePath: string, line: number, col: number) {
    this.loadFile(filePath, line, col);
  }
}

const EditorStateContext = createContext<EditorState>(new EditorState());

export const EditorStateProvider = EditorStateContext.Provider;
export function useEditorState() {
  return useContext(EditorStateContext);
}
