import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { seedStarterCode } from "./room";

export type RoomStatus = {
  /** Connection to the signaling server, which peers use to find each other. */
  signaling: "connecting" | "connected" | "disconnected";
  /** Peers connected over WebRTC (other browsers or computers). */
  networkPeers: number;
  /** Other tabs in this browser. y-webrtc syncs these through BroadcastChannel, not the network. */
  tabPeers: number;
  /** True once every network peer has finished its initial sync. Never fires with zero network peers. */
  synced: boolean;
};

export type RoomSession = {
  doc: Y.Doc;
  provider: WebrtcProvider;
};

/** y-webrtc's signaling connections are lib0 WebsocketClients, but its types say any[]. */
type SignalingConn = {
  connected: boolean;
  connecting: boolean;
  on(event: "connect" | "disconnect", handler: () => void): void;
  off(event: "connect" | "disconnect", handler: () => void): void;
};

/**
 * Our own signaling server, started with `npm run signaling` (y-webrtc's
 * bundled server). It's on the same host as the page, so another computer
 * that opens the page over your network finds it too. We don't use y-webrtc's
 * public default (wss://y-webrtc-eu.fly.dev): it's shared with everyone, and
 * it returned HTTP 503 when we tested in November 2026.
 */
const SIGNALING_PORT = 4444;

/**
 * y-webrtc allows only one provider per room name, and destroy() frees the
 * name asynchronously. When the component remounts (Strict Mode in dev, Fast
 * Refresh), the new provider waits here for the old one to finish closing.
 */
const closingRooms = new Map<string, Promise<void>>();

/** Joins a password-protected y-webrtc room and reports honest connection status. */
export function useWebrtcRoom(roomName: string, password: string) {
  const [session, setSession] = useState<RoomSession | null>(null);
  const [status, setStatus] = useState<RoomStatus>({
    signaling: "connecting",
    networkPeers: 0,
    tabPeers: 0,
    synced: false,
  });

  useEffect(() => {
    let stopped = false;
    let teardown: (() => void) | undefined;

    const previousClose = closingRooms.get(roomName) ?? Promise.resolve();
    previousClose.then(() => {
      if (stopped) return;

      const doc = new Y.Doc();
      seedStarterCode(doc);
      const provider = new WebrtcProvider(roomName, doc, {
        password,
        signaling: [`ws://${window.location.hostname}:${SIGNALING_PORT}`],
      });
      const signalingConns = provider.signalingConns as SignalingConn[];

      const updateSignaling = () => {
        const signaling = signalingConns.some((c) => c.connected)
          ? "connected"
          : signalingConns.some((c) => c.connecting)
            ? "connecting"
            : "disconnected";
        setStatus((s) => ({ ...s, signaling }));
      };
      const updatePeers = ({ webrtcPeers, bcPeers }: { webrtcPeers: string[]; bcPeers: string[] }) => {
        setStatus((s) => ({ ...s, networkPeers: webrtcPeers.length, tabPeers: bcPeers.length }));
      };
      const updateSynced = ({ synced }: { synced: boolean }) => {
        setStatus((s) => ({ ...s, synced }));
      };

      signalingConns.forEach((conn) => {
        conn.on("connect", updateSignaling);
        conn.on("disconnect", updateSignaling);
      });
      provider.on("peers", updatePeers);
      provider.on("synced", updateSynced);
      updateSignaling();
      setSession({ doc, provider });

      teardown = () => {
        signalingConns.forEach((conn) => {
          conn.off("connect", updateSignaling);
          conn.off("disconnect", updateSignaling);
        });
        provider.off("peers", updatePeers);
        provider.off("synced", updateSynced);
        provider.destroy();
        doc.destroy();
        // destroy() frees the room name in a callback on provider.key.
        // Callbacks run in the order they were added, so this one runs after it.
        closingRooms.set(
          roomName,
          new Promise((resolve) => provider.key.then(() => resolve())),
        );
      };
    });

    return () => {
      stopped = true;
      teardown?.();
    };
  }, [roomName, password]);

  return { session, status };
}
