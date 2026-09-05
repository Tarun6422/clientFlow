import { useState } from 'react';
import FlowRobot from './FlowRobot';
import FlowPanel from './FlowPanel';

/** Floating robot button that opens the Flow interview panel. */
export default function FlowLauncher({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flow-launcher fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-xl shadow-brand-600/40 transition-transform hover:scale-105 active:scale-95"
          aria-label="Open Flow — the website copilot"
          title="Open Flow"
        >
          <FlowRobot state="idle" size={30} />
        </button>
      )}
      {open && <FlowPanel clientId={clientId} onClose={() => setOpen(false)} />}
    </>
  );
}