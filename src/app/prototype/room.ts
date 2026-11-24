import * as Y from "yjs";

/** Name of the shared Y.Text that holds the editor contents. */
export const TEXT_NAME = "monaco";

const STARTER_CODE = `function hello() {
  console.log("Hello from InterviewOS!");
}

hello();`;

/**
 * Fixed Yjs client ID for the starter code. Real clients get a random 32-bit
 * ID, so a collision with 0 is practically impossible.
 */
const SEED_CLIENT_ID = 0;

export type RoomInfo = {
  /** Short ID shown in the UI. */
  id: string;
  /** Room name passed to y-webrtc. */
  roomName: string;
  /** Shared secret. y-webrtc uses it to encrypt everything sent through the signaling server. */
  password: string;
};

/**
 * Reads the room from the URL hash (`#room=...&key=...`), or makes up a new
 * private room if it's missing. Use roomHash() to put it back in the URL, so
 * the page's URL is the invite link. Browsers never send the hash to our
 * server.
 */
export function readOrCreateRoom(): RoomInfo {
  const params = new URLSearchParams(window.location.hash.slice(1));
  let id = params.get("room");
  let password = params.get("key");

  if (!id || !password) {
    id = randomHex(8);
    password = randomHex(16);
  }

  return { id, roomName: `interviewos-${id}`, password };
}

/** The URL hash that invites someone to this room. */
export function roomHash(room: RoomInfo) {
  return `#room=${room.id}&key=${room.password}`;
}

/**
 * Adds the starter code in a way that can never duplicate it.
 *
 * Yjs identifies each insert by (client ID, clock). Every window builds the
 * starter code under the same fixed client ID, so every window produces the
 * same insert, and when windows sync Yjs keeps one copy no matter who joined
 * first. This also works when you're alone in the room. Waiting for
 * y-webrtc's "synced" event doesn't, because it only fires once a peer
 * connects.
 *
 * Every client must use the same STARTER_CODE, so changing it only works when
 * everyone in the room reloads.
 */
export function seedStarterCode(doc: Y.Doc) {
  const seed = new Y.Doc();
  seed.clientID = SEED_CLIENT_ID;
  seed.getText(TEXT_NAME).insert(0, STARTER_CODE);
  Y.applyUpdate(doc, Y.encodeStateAsUpdate(seed));
  seed.destroy();
}

function randomHex(byteCount: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteCount));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
