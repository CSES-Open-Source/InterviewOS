"use client";

import dynamic from "next/dynamic";

// The editor reads its room from the URL hash, which only exists in the
// browser, so skip server rendering for it.
const CollabEditor = dynamic(() => import("./collab-editor"), {
  ssr: false,
  loading: () => <p className="p-6 text-sm">Loading editor…</p>,
});

export default function PrototypePage() {
  return <CollabEditor />;
}
