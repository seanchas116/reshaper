import { createContext, useContext } from "react";
import { loadFile, saveFile } from "../actions/actions";
import { makeObservable, observable } from "mobx";
import { parse } from "@babel/parser";
import { Workspace } from "../models/workspace";
import { Node } from "../models/node";
import { File } from "../models/file";
import generate from "@babel/generator";
import debounce from "just-debounce-it";

export class EditorState {
  constructor() {
    makeObservable(this);

    this.workspace.nodeStore.data.observe_(() => {
      this.saveFile();
    });
  }

  readonly workspace = new Workspace();

  @observable filePath: string = "";
  @observable pathname: string = "";
  @observable hoveredNodeID: string | undefined = undefined;

  get file(): File | undefined {
    return this.workspace.files.get(this.filePath);
  }
  get fileNode(): Node | undefined {
    return this.file?.node;
  }

  get hoveredNode() {
    return this.hoveredNodeID
      ? this.workspace.nodes.safeGet(this.hoveredNodeID)
      : undefined;
  }

  async loadFile(filePath: string, line: number, col: number) {
    let file = this.workspace.files.get(filePath);
    if (!file) {
      const file = await loadFile(filePath);

      const ast = parse(file, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      });

      this.filePath = filePath;
      this.workspace.loadFileAST(filePath, ast);
    }

    const node = this.workspace.nodeForLocation(filePath, line, col);
    this.workspace.selectedNodeIDs.replace(node ? [node.id] : []);
    node?.expandAllAncestors();
    this.filePath = filePath;
  }

  async revealLocation(filePath: string, line: number, col: number) {
    this.loadFile(filePath, line, col);
  }

  saveFile = debounce(async () => {
    const file = this.file;
    if (!file) {
      return;
    }
    const ast = file.toModifiedAST();
    const code = generate(ast, {
      retainLines: true,
      retainFunctionParens: true,
    }).code;
    console.log(code);

    await saveFile(file.filePath, generate(ast).code);
  }, 100);
}

const EditorStateContext = createContext<EditorState>(new EditorState());

export const EditorStateProvider = EditorStateContext.Provider;
export function useEditorState() {
  return useContext(EditorStateContext);
}
