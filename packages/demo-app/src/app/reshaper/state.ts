import { createContext, useContext } from "react";
import { loadFile } from "./actions";
import { makeObservable, observable } from "mobx";
import { parse } from "@babel/parser";
import { File } from "@babel/types";

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
    });
  }

  filePath: string = "";
  line: number = 0;
  col: number = 0;
  content: string = "";
  ast: File | undefined = undefined;

  async loadFile(filePath: string, line: number, col: number) {
    if (this.filePath !== filePath) {
      const file = await loadFile(filePath);
      console.log(file);
      this.filePath = filePath;

      const ast = parse(file, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      });

      console.log(ast);
      this.ast = ast;
    }
    this.line = line;
    this.col = col;
  }

  async revealLocation(filePath: string, line: number, col: number) {
    console.log(filePath, line, col);
    this.loadFile(filePath, line, col);
  }
}

const EditorStateContext = createContext<EditorState>(new EditorState());

export const EditorStateProvider = EditorStateContext.Provider;
export function useEditorState() {
  return useContext(EditorStateContext);
}
