
"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import type * as Monaco from "monaco-editor";

type Language = "javascript" | "typescript" | "python";

const ROOM_NAME = "interviewos-monaco-prototype";

export default function PrototypePage() {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const updatingFromYjs = useRef(false);
  const [language, setLanguage] = useState<Language>("javascript");
  const [clientCount, setClientCount] = useState(1);
  const status = "Prototype active";

  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new WebrtcProvider(ROOM_NAME, doc);
    const yText = doc.getText("monaco");

    providerRef.current = provider;
    yTextRef.current = yText;

    provider.awareness.setLocalStateField("user", {
      name: `User ${doc.clientID}`,
    });

    const updateCount = () => {
      setClientCount(provider.awareness.getStates().size);
    };

    provider.awareness.on("change", updateCount);
    updateCount();

    return () => {
      provider.awareness.off("change", updateCount);
      provider.destroy();
      doc.destroy();
      providerRef.current = null;
      yTextRef.current = null;
    };
  }, []);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    const provider = providerRef.current;
    const yText = yTextRef.current;

    if (!provider || !yText) {
      console.error("Yjs is not ready.");
      return;
    }

    if (yText.length === 0) {
      yText.insert(
        0,
        `function hello() {
  console.log("Hello from InterviewOS!");
}

hello();`
      );
    }

    updatingFromYjs.current = true;
    editor.setValue(yText.toString());
    updatingFromYjs.current = false;

    // Monaco changes -> Yjs
    editor.onDidChangeModelContent((event) => {
      if (updatingFromYjs.current) return;

      const changes = [...event.changes].sort(
        (a, b) => b.rangeOffset - a.rangeOffset
      );

      yText.doc?.transact(() => {
        for (const change of changes) {
          if (change.rangeLength > 0) {
            yText.delete(change.rangeOffset, change.rangeLength);
          }

          if (change.text.length > 0) {
            yText.insert(change.rangeOffset, change.text);
          }
        }
      });
    });

    // Yjs changes -> Monaco
    const handleYjsChange = () => {
      const sharedValue = yText.toString();

      if (editor.getValue() === sharedValue) return;

      updatingFromYjs.current = true;
      editor.setValue(sharedValue);
      updatingFromYjs.current = false;
    };

    yText.observe(handleYjsChange);

    // Cursor and selection -> Yjs Awareness
    editor.onDidChangeCursorSelection((event) => {
      const selection = event.selection;
      const position = selection.getPosition();

      provider.awareness.setLocalStateField("cursor", {
        position: {
          lineNumber: position.lineNumber,
          column: position.column,
        },
        selection: {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn,
        },
      });
    });

    // Yjs Awareness -> Remote cursor decorations
    const remoteDecorations = new Map<number, string[]>();

    const updateRemoteCursors = () => {
      const states = provider.awareness.getStates();

      for (const [clientId, state] of states) {
        if (clientId === provider.awareness.clientID) continue;

        const cursor = state.cursor;
        if (!cursor) continue;

        const selection = cursor.selection;
        const position = cursor.position;

        if (!position || !selection) continue;

        const decorations = [];

        if (
          selection.startLineNumber !== selection.endLineNumber ||
          selection.startColumn !== selection.endColumn
        ) {
          decorations.push({
            range: new monaco.Range(
              selection.startLineNumber,
              selection.startColumn,
              selection.endLineNumber,
              selection.endColumn
            ),
            options: {
              inlineClassName: "remote-selection",
              description: "Remote user selection",
            },
          });
        }

        decorations.push({
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          options: {
            beforeContentClassName: "remote-cursor",
            description: "Remote user cursor",
          },
        });

        const previous = remoteDecorations.get(clientId) || [];

        const next = editor.deltaDecorations(
          previous,
          decorations
        );

        remoteDecorations.set(clientId, next);
      }

      // Remove decorations for users who disconnected.
      for (const [clientId, ids] of remoteDecorations) {
        if (!states.has(clientId)) {
          editor.deltaDecorations(ids, []);
          remoteDecorations.delete(clientId);
        }
      }
    };

    provider.awareness.on("change", updateRemoteCursors);
    updateRemoteCursors();

    editor.onDidDispose(() => {
      yText.unobserve(handleYjsChange);
      provider.awareness.off("change", updateRemoteCursors);

      for (const ids of remoteDecorations.values()) {
        editor.deltaDecorations(ids, []);
      }

      remoteDecorations.clear();
    });
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newLanguage = event.target.value as Language;
    setLanguage(newLanguage);

    const editor = editorRef.current;
    const model = editor?.getModel();

    if (model) {
      import("monaco-editor").then((monaco) => {
        monaco.editor.setModelLanguage(model, newLanguage);
      });
    }
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold">
          Monaco Collaborative Editor Prototype
        </h1>

        <div className="mt-2 mb-4 flex gap-4 text-sm">
          <span>Status: <strong>{status}</strong></span>
          <span>Users connected: <strong>{clientCount}</strong></span>

          <label>
            Language:{" "}
            <select
              value={language}
              onChange={handleLanguageChange}
              className="rounded border px-2 py-1"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
            </select>
          </label>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Editor
            height="70vh"
            defaultLanguage={language}
            theme="vs-dark"
            defaultValue=""
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
            }}
          />
        </div>

        <p className="mt-4 text-sm">
          Open two browser windows to collaborate.
          Cursor positions and selections are shared.
        </p>
      </div>
    </main>
  );
}

