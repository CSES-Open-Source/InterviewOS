"use client";

import { useEffect, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { MonacoBinding, type Monaco } from "./monaco-binding";
import { readOrCreateRoom, roomHash, TEXT_NAME } from "./room";
import { addSharedUndo } from "./shared-undo";
import { useWebrtcRoom, type RoomStatus } from "./use-webrtc-room";

type Language = "javascript" | "typescript" | "python";

type MountedEditor = {
  editor: Parameters<OnMount>[0];
  monaco: Monaco;
};

export default function CollabEditor() {
  const [room] = useState(readOrCreateRoom);
  const { session, status } = useWebrtcRoom(room.roomName, room.password);
  const [mounted, setMounted] = useState<MountedEditor | null>(null);
  const [language, setLanguage] = useState<Language>("javascript");

  // Put the room in the URL so the address bar is the invite link. This has
  // to happen in an effect: Next.js's router listens to history changes and
  // can't update while this component is rendering.
  useEffect(() => {
    const hash = roomHash(room);
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  }, [room]);

  // Pasting a different invite link into this tab only changes the hash,
  // which doesn't reload the page. Reload so we join the new room.
  useEffect(() => {
    const reload = () => window.location.reload();
    window.addEventListener("hashchange", reload);
    return () => window.removeEventListener("hashchange", reload);
  }, []);

  // Connect the editor to the shared doc once both exist.
  useEffect(() => {
    if (!session || !mounted) return;
    const model = mounted.editor.getModel();
    if (!model) return;

    const ytext = session.doc.getText(TEXT_NAME);
    const binding = new MonacoBinding(
      mounted.monaco,
      ytext,
      model,
      new Set([mounted.editor]),
      session.provider.awareness,
    );
    // The binding's own edits use it as their transaction origin.
    const undo = addSharedUndo(mounted.monaco, mounted.editor, ytext, binding);
    return () => {
      undo.dispose();
      binding.destroy();
    };
  }, [session, mounted]);

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold">
          Monaco Collaborative Editor Prototype
        </h1>

        <div className="mt-2 mb-4 flex flex-wrap gap-4 text-sm">
          <span>
            Room: <strong>{room.id}</strong>
          </span>
          <StatusSummary status={status} />

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
            onMount={(editor, monaco) => setMounted({ editor, monaco })}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
            }}
          />
        </div>

        <p className="mt-4 text-sm">
          Run <code>npm run signaling</code> in a second terminal first. To
          invite someone, send them this page&apos;s full URL. The room
          password is in the part after #, which browsers don&apos;t send to
          our server. Test with two different browsers: tabs in the same
          browser sync without using the network.
        </p>
      </div>
    </main>
  );
}

function StatusSummary({ status }: { status: RoomStatus }) {
  const synced =
    status.networkPeers === 0
      ? "no network peers"
      : status.synced
        ? "yes"
        : "syncing…";

  return (
    <>
      <span>
        Signaling: <strong>{status.signaling}</strong>
      </span>
      <span>
        Network peers: <strong>{status.networkPeers}</strong>
      </span>
      <span>
        Other tabs: <strong>{status.tabPeers}</strong>
      </span>
      <span>
        Synced: <strong>{synced}</strong>
      </span>
    </>
  );
}
