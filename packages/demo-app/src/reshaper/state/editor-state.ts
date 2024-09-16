import { createContext, useContext } from "react";
import { formatCode, loadFile, saveFile } from "../actions/actions";
import { action, makeObservable, observable, runInAction } from "mobx";
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

  async loadFile(filePath: string) {
    if (!this.workspace.files.get(filePath)) {
      const code = await loadFile(filePath);

      const ast = parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      });

      runInAction(() => {
        this.filePath = filePath;
        this.workspace.loadFileAST(filePath, code, ast);
      });
    }
  }

  async revealLocation(filePath: string, elementIndex: number) {
    await this.loadFile(filePath);

    runInAction(() => {
      const node = this.workspace.nodeForLocation(filePath, elementIndex);
      this.workspace.selectedNodeIDs.replace(node ? [node.id] : []);
      node?.expandAllAncestors();
      this.filePath = filePath;
    });
  }

  private saveFile = debounce(
    action(async () => {
      const file = this.file;
      if (!file) {
        return;
      }
      file.updateElementIndexForNode();
      const ast = file.toModifiedAST();
      const code = await formatCode(
        generate(ast, {
          retainLines: true,
          retainFunctionParens: true,
        }).code,
      );

      await saveFile(file.filePath, code);
    }),
    100,
  );
}

const EditorStateContext = createContext<EditorState>(new EditorState());

export const EditorStateProvider = EditorStateContext.Provider;
export function useEditorState() {
  return useContext(EditorStateContext);
}
