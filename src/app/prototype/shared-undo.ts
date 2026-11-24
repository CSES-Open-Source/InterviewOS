import * as Y from "yjs";
import type * as MonacoApi from "monaco-editor";
import type { Monaco } from "./monaco-binding";

/**
 * Replaces Monaco's undo and redo keys with a Yjs UndoManager.
 *
 * Monaco's own undo stack doesn't know about edits from other people (the
 * binding applies them outside the stack), so pressing undo after someone
 * else typed removes the wrong characters. Y.UndoManager only tracks changes
 * made with the given origin (this window's binding) and works in shared-doc
 * positions, so undo removes your own last edit even if others typed since.
 */
export function addSharedUndo(
  monaco: Monaco,
  editor: MonacoApi.editor.IStandaloneCodeEditor,
  ytext: Y.Text,
  origin: unknown,
): MonacoApi.IDisposable {
  const undoManager = new Y.UndoManager(ytext, {
    trackedOrigins: new Set([origin]),
  });
  const { KeyMod, KeyCode } = monaco;

  // Keybindings added by the editor take priority over Monaco's defaults.
  const actions = [
    editor.addAction({
      id: "shared-undo",
      label: "Undo (shared)",
      keybindings: [KeyMod.CtrlCmd | KeyCode.KeyZ],
      run: () => {
        undoManager.undo();
      },
    }),
    editor.addAction({
      id: "shared-redo",
      label: "Redo (shared)",
      keybindings: [
        KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyZ,
        KeyMod.CtrlCmd | KeyCode.KeyY,
      ],
      run: () => {
        undoManager.redo();
      },
    }),
  ];

  return {
    dispose: () => {
      actions.forEach((action) => action.dispose());
      undoManager.destroy();
    },
  };
}
