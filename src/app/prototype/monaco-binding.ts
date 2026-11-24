/*
 * Monaco <-> Yjs binding, copied from y-monaco 0.1.6
 * (https://github.com/yjs/y-monaco/blob/v0.1.6/src/y-monaco.js).
 *
 * Why a copy: y-monaco imports "monaco-editor/esm/vs/editor/editor.api.js",
 * and the "exports" map in monaco-editor 0.57 turns that into a path that
 * doesn't exist, so the package can't be imported. This copy takes the Monaco
 * instance as a constructor argument instead (the one @monaco-editor/react
 * passes to onMount), so the page loads only one copy of Monaco.
 *
 * Other changes from upstream:
 * - Converted to TypeScript.
 * - Inlined lib0's createMutex instead of importing a transitive dependency.
 * - Registers the awareness listener once instead of once per editor.
 * - destroy() also disposes the cursor listeners and removes remote cursor
 *   decorations. Upstream leaves both behind. It is also safe to call twice.
 *
 * Original license:
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 Kevin Jahns <kevin.jahns@protonmail.com>.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import * as Y from "yjs";
import type * as MonacoApi from "monaco-editor";
import type { WebrtcProvider } from "y-webrtc";

export type Monaco = typeof MonacoApi;
type Editor = MonacoApi.editor.IStandaloneCodeEditor;
type Model = MonacoApi.editor.ITextModel;
type Awareness = WebrtcProvider["awareness"];

type RelativeSelection = {
  start: Y.RelativePosition;
  end: Y.RelativePosition;
  direction: MonacoApi.SelectionDirection;
};

/** What each client publishes in its awareness state under `selection`. */
type AwarenessSelection = {
  anchor: Y.RelativePosition;
  head: Y.RelativePosition;
};

/** Runs `f` unless a call made through the same mutex is already running. */
function createMutex() {
  let token = true;
  return (f: () => void) => {
    if (token) {
      token = false;
      try {
        f();
      } finally {
        token = true;
      }
    }
  };
}

function createRelativeSelection(
  editor: Editor,
  monacoModel: Model,
  type: Y.Text,
): RelativeSelection | null {
  const sel = editor.getSelection();
  if (sel === null) return null;
  const start = Y.createRelativePositionFromTypeIndex(
    type,
    monacoModel.getOffsetAt(sel.getStartPosition()),
  );
  const end = Y.createRelativePositionFromTypeIndex(
    type,
    monacoModel.getOffsetAt(sel.getEndPosition()),
  );
  return { start, end, direction: sel.getDirection() };
}

function createMonacoSelectionFromRelativeSelection(
  monaco: Monaco,
  editor: Editor,
  type: Y.Text,
  relSel: RelativeSelection,
  doc: Y.Doc,
): MonacoApi.Selection | null {
  const start = Y.createAbsolutePositionFromRelativePosition(relSel.start, doc);
  const end = Y.createAbsolutePositionFromRelativePosition(relSel.end, doc);
  const model = editor.getModel();
  if (
    model !== null &&
    start !== null &&
    end !== null &&
    start.type === type &&
    end.type === type
  ) {
    const startPos = model.getPositionAt(start.index);
    const endPos = model.getPositionAt(end.index);
    return monaco.Selection.createWithDirection(
      startPos.lineNumber,
      startPos.column,
      endPos.lineNumber,
      endPos.column,
      relSel.direction,
    );
  }
  return null;
}

export class MonacoBinding {
  readonly doc: Y.Doc;
  private readonly monaco: Monaco;
  private readonly ytext: Y.Text;
  private readonly monacoModel: Model;
  private readonly editors: Set<Editor>;
  private readonly awareness: Awareness | null;
  private readonly mux = createMutex();
  private readonly disposables: MonacoApi.IDisposable[] = [];
  private savedSelections = new Map<Editor, RelativeSelection>();
  private decorations = new Map<Editor, string[]>();
  private destroyed = false;

  constructor(
    monaco: Monaco,
    ytext: Y.Text,
    monacoModel: Model,
    editors: Set<Editor> = new Set(),
    awareness: Awareness | null = null,
  ) {
    if (ytext.doc === null) {
      throw new Error("MonacoBinding: the Y.Text must belong to a Y.Doc.");
    }
    this.doc = ytext.doc;
    this.monaco = monaco;
    this.ytext = ytext;
    this.monacoModel = monacoModel;
    this.editors = editors;
    this.awareness = awareness;

    this.doc.on("beforeAllTransactions", this.beforeTransaction);
    ytext.observe(this.ytextObserver);

    const ytextValue = ytext.toString();
    if (monacoModel.getValue() !== ytextValue) {
      monacoModel.setValue(ytextValue);
    }

    this.disposables.push(
      monacoModel.onDidChangeContent((event) => {
        // Apply changes from right to left so earlier offsets stay valid.
        this.mux(() => {
          this.doc.transact(() => {
            [...event.changes]
              .sort((a, b) => b.rangeOffset - a.rangeOffset)
              .forEach((change) => {
                ytext.delete(change.rangeOffset, change.rangeLength);
                ytext.insert(change.rangeOffset, change.text);
              });
          }, this);
        });
      }),
      monacoModel.onWillDispose(() => this.destroy()),
    );

    if (awareness) {
      editors.forEach((editor) => {
        this.disposables.push(
          editor.onDidChangeCursorSelection(() => {
            if (editor.getModel() !== monacoModel) return;
            const sel = editor.getSelection();
            if (sel === null) return;
            let anchor = monacoModel.getOffsetAt(sel.getStartPosition());
            let head = monacoModel.getOffsetAt(sel.getEndPosition());
            if (sel.getDirection() === monaco.SelectionDirection.RTL) {
              [anchor, head] = [head, anchor];
            }
            const selection: AwarenessSelection = {
              anchor: Y.createRelativePositionFromTypeIndex(ytext, anchor),
              head: Y.createRelativePositionFromTypeIndex(ytext, head),
            };
            awareness.setLocalStateField("selection", selection);
          }),
        );
      });
      awareness.on("change", this.rerenderDecorations);
    }
  }

  /** Saves each local selection as Yjs relative positions before the doc changes. */
  private beforeTransaction = () => {
    this.mux(() => {
      this.savedSelections = new Map();
      this.editors.forEach((editor) => {
        if (editor.getModel() === this.monacoModel) {
          const rsel = createRelativeSelection(editor, this.monacoModel, this.ytext);
          if (rsel !== null) {
            this.savedSelections.set(editor, rsel);
          }
        }
      });
    });
  };

  /** Draws every other client's cursor and selection, replacing the previous set. */
  private rerenderDecorations = () => {
    this.editors.forEach((editor) => {
      if (!this.awareness || editor.getModel() !== this.monacoModel) {
        this.decorations.delete(editor);
        return;
      }
      const currentDecorations = this.decorations.get(editor) ?? [];
      const newDecorations: MonacoApi.editor.IModelDeltaDecoration[] = [];
      this.awareness.getStates().forEach((state, clientID) => {
        const selection = state.selection as AwarenessSelection | undefined;
        if (
          clientID === this.doc.clientID ||
          selection?.anchor == null ||
          selection.head == null
        ) {
          return;
        }
        const anchorAbs = Y.createAbsolutePositionFromRelativePosition(selection.anchor, this.doc);
        const headAbs = Y.createAbsolutePositionFromRelativePosition(selection.head, this.doc);
        if (
          anchorAbs === null ||
          headAbs === null ||
          anchorAbs.type !== this.ytext ||
          headAbs.type !== this.ytext
        ) {
          return;
        }
        const headClassName = `yRemoteSelectionHead yRemoteSelectionHead-${clientID}`;
        const forward = anchorAbs.index < headAbs.index;
        const start = this.monacoModel.getPositionAt(forward ? anchorAbs.index : headAbs.index);
        const end = this.monacoModel.getPositionAt(forward ? headAbs.index : anchorAbs.index);
        newDecorations.push({
          range: new this.monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
          options: {
            className: `yRemoteSelection yRemoteSelection-${clientID}`,
            afterContentClassName: forward ? headClassName : null,
            beforeContentClassName: forward ? null : headClassName,
          },
        });
      });
      this.decorations.set(editor, editor.deltaDecorations(currentDecorations, newDecorations));
    });
  };

  /** Applies remote Yjs changes to the Monaco model as small edits, then restores local selections. */
  private ytextObserver = (event: Y.YTextEvent) => {
    this.mux(() => {
      let index = 0;
      event.delta.forEach((op) => {
        if (op.retain !== undefined) {
          index += op.retain;
        } else if (op.insert !== undefined) {
          const pos = this.monacoModel.getPositionAt(index);
          const range = new this.monaco.Selection(pos.lineNumber, pos.column, pos.lineNumber, pos.column);
          const insert = op.insert as string;
          this.monacoModel.applyEdits([{ range, text: insert }]);
          index += insert.length;
        } else if (op.delete !== undefined) {
          const pos = this.monacoModel.getPositionAt(index);
          const endPos = this.monacoModel.getPositionAt(index + op.delete);
          const range = new this.monaco.Selection(pos.lineNumber, pos.column, endPos.lineNumber, endPos.column);
          this.monacoModel.applyEdits([{ range, text: "" }]);
        } else {
          throw new Error("MonacoBinding: unexpected delta operation.");
        }
      });
      this.savedSelections.forEach((rsel, editor) => {
        const sel = createMonacoSelectionFromRelativeSelection(
          this.monaco,
          editor,
          this.ytext,
          rsel,
          this.doc,
        );
        if (sel !== null) {
          editor.setSelection(sel);
        }
      });
    });
    this.rerenderDecorations();
  };

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.disposables.forEach((d) => d.dispose());
    this.ytext.unobserve(this.ytextObserver);
    this.doc.off("beforeAllTransactions", this.beforeTransaction);
    this.awareness?.off("change", this.rerenderDecorations);
    this.decorations.forEach((ids, editor) => editor.deltaDecorations(ids, []));
    this.decorations.clear();
  }
}
