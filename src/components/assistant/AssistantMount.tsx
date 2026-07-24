"use client";

import dynamic from "next/dynamic";

// next/dynamic with ssr:false is only valid inside a Client Component (the
// App Router forbids it directly in a Server Component) — this thin wrapper
// is what the (mostly server) portal layout actually imports, so the
// widget's JS (Framer Motion, react-markdown, the streaming hook) is a
// separate chunk that loads after hydration instead of blocking first paint.
const AiAssistantWidget = dynamic(() => import("./AiAssistantWidget"), { ssr: false });

export default function AssistantMount() {
  return <AiAssistantWidget />;
}
