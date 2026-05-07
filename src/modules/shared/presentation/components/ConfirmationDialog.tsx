interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

const confirmButtonClassByVariant = {
  danger: "bg-red-600 text-white hover:bg-red-700",
  primary: "bg-sky-700 text-white hover:bg-sky-800",
};

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmText = "Si",
  cancelText = "No",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${confirmButtonClassByVariant[confirmVariant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
