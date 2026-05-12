interface BlockingLoaderOverlayProps {
  isOpen: boolean;
  message?: string;
}

export function BlockingLoaderOverlay({
  isOpen,
  message = "Procesando...",
}: BlockingLoaderOverlayProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 backdrop-blur-[1px]">
      <div className="flex w-[92vw] max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xl">
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600"
        />
        <p className="break-words text-sm font-medium text-slate-700">{message}</p>
      </div>
    </div>
  );
}
