import { createContext, useContext } from "react";
import { loadFile } from "../actions/actions";
import { makeObservable, observable } from "mobx";
import { parse } from "@babel/parser";
import { Rect } from "paintvec";
import { Workspace } from "../models/workspace";

export class EditorState {
  constructor() {
    makeObservable(this);
  }

  readonly workspace = new Workspace();

  @observable filePath: string = "";
  @observable pathname: string = "";
  @observable.ref hoveredRect: Rect | undefined = undefined;
  @observable hoveredNodeID: string | undefined = undefined;

  async loadFile(filePath: string, line: number, col: number) {
    if (this.filePath !== filePath) {
      const file = await loadFile(filePath);
      this.filePath = filePath;

      const ast = parse(file, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      });

      this.workspace.loadFileAST(ast);
    }

    const node = this.workspace.nodeForLocation(line, col);
    this.workspace.selectedNodeIDs.replace(node ? [node.id] : []);
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
