import { createContext, useContext } from "react";
import { loadFile } from "../actions/actions";
import { makeObservable, observable } from "mobx";
import { parse } from "@babel/parser";
import { Rect } from "paintvec";
import { Workspace } from "../models/workspace";
import { Node } from "../models/node";

export class EditorState {
  constructor() {
    makeObservable(this);
  }

  readonly workspace = new Workspace();

  @observable filePath: string = "";
  @observable pathname: string = "";
  @observable hoveredNodeID: string | undefined = undefined;

  get fileNode(): Node | undefined {
    return this.workspace.fileNodes.get(this.filePath);
  }

  get hoveredNode() {
    return this.hoveredNodeID
      ? this.workspace.nodes.safeGet(this.hoveredNodeID)
      : undefined;
  }

  async loadFile(filePath: string, line: number, col: number) {
    let fileNode = this.workspace.fileNodes.get(filePath);
    if (!fileNode) {
      const file = await loadFile(filePath);

      const ast = parse(file, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      });

      this.filePath = filePath;
      fileNode = this.workspace.loadFileAST(filePath, ast);
    }

    const node = this.workspace.nodeForLocation(line, col);
    this.workspace.selectedNodeIDs.replace(node ? [node.id] : []);
    node?.expandAllAncestors();
    this.filePath = filePath;
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
