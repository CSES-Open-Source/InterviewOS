
"use client";

import { useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";

type Language = "javascript" | "typescript" | "python";

export default function BroadcastPrototypePage() {
  const [language, setLanguage] = useState<Language>("javascript");
  const [status, setStatus] = useState("Starting...");

  const handleEditorMount: OnMount = (editor) => {
    const channel = new BroadcastChannel(
      "interviewos-broadcast-prototype"
    );

    let applyingRemote = false;

    const starterCode = `function hello() {
  console.log("Hello from InterviewOS!");
}

hello();`;

    if (!editor.getValue()) {
      editor.setValue(starterCode);
    }

    // Receive messages from other browser windows.
    channel.onmessage = (event) => {
      const message = event.data;

      if (message.type === "request") {
        channel.postMessage({
          type: "content",
          content: editor.getValue(),
        });
      }

      if (message.type === "content") {
        if (message.content === editor.getValue()) return;

        applyingRemote = true;
        editor.setValue(message.content);
        applyingRemote = false;
      }
    };

    // Send the current document whenever another window joins.
    channel.postMessage({ type: "request" });

    // Send edits to other windows.
    const changeListener = editor.onDidChangeModelContent(() => {
      if (applyingRemote) return;

      channel.postMessage({
        type: "content",
        content: editor.getValue(),
      });
    });

    setStatus("BroadcastChannel active");

    editor.onDidDispose(() => {
      changeListener.dispose();
      channel.close();
    });
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold">
          BroadcastChannel Editor Prototype
        </h1>

        <div className="mt-2 mb-4 flex gap-4 text-sm">
          <span>
            Status: <strong>{status}</strong>
          </span>

          <label>
            Language:{" "}
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
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
            language={language}
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
          Open this page in two browser windows to test
          BroadcastChannel synchronization.
        </p>
      </div>
    </main>
  );
}

