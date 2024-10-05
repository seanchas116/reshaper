import { computed, makeObservable, observable } from "mobx";
import { EditorState } from "./editor-state";
import { Rect } from "paintvec";
import { Node } from "../models/node";
import { Workspace } from "../models/workspace";

export class ViewportState {
  constructor(editorState: EditorState) {
    this.editorState = editorState;
    makeObservable(this);
  }

  readonly editorState: EditorState;

  @observable.ref iframe: HTMLIFrameElement | undefined = undefined;

  setIFrame(iframe: HTMLIFrameElement | undefined) {
    this.iframe = iframe;
  }

  getBoundingBoxes(node: Node): Rect[] {
    if (!this.iframe?.contentDocument) return [];

    const elementIndex = this.editorState.file?.elementIndexForNode.get(node);
    if (elementIndex === undefined) return [];

    const fileName = this.editorState.filePath;
    const selector = `[data-reshaper-loc="${fileName}:${elementIndex}"]`;

    const elements = this.iframe.contentDocument.querySelectorAll(selector);
    const boundingBoxes: Rect[] = [];
    for (const elem of elements) {
      boundingBoxes.push(Rect.from(elem.getBoundingClientRect()));
    }

    return boundingBoxes;
  }

  @computed get hoveredBoundingBoxes(): Rect[] {
    const hoveredNode = this.editorState.hoveredNode;
    if (!hoveredNode) return [];

    return this.getBoundingBoxes(hoveredNode);
  }

  @computed get selectedBoundingBoxes(): Rect[] {
    return this.editorState.workspace.selectedNodes.flatMap((node) =>
      this.getBoundingBoxes(node),
    );
  }

  locateNode(
    clientX: number,
    clientY: number,
  ):
    | {
        node: Node | undefined;
        filePath: string;
        nodeIndex: number;
      }
    | undefined {
    if (!this.iframe) return;

    const elem = this.iframe.contentDocument?.elementFromPoint(
      clientX - this.iframe.getBoundingClientRect().left,
      clientY - this.iframe.getBoundingClientRect().top,
    );
    if (!elem) return;

    const location = elem.getAttribute("data-reshaper-loc");
    if (!location) {
      return;
    }
    const [filePath, nodeIndex] = location.split(":");

    const node = this.editorState.workspace.nodeForLocation(
      filePath,
      +nodeIndex,
    );
    return { node, filePath, nodeIndex: +nodeIndex };
  }

  revealPoint(clientX: number, clientY: number): void {
    const res = this.locateNode(clientX, clientY);
    if (!res) return;
    this.editorState.revealLocation(res.filePath, res.nodeIndex);
  }

  sendEdit() {
    const receive = this.iframe?.contentWindow?.__reshaperReceiveEdit;
    if (receive) {
      receive(this.editorState.workspace);
    }
  }
}

declare global {
  interface Window {
    __reshaperReceiveEdit?: (workspace: Workspace) => void;
  }
}
