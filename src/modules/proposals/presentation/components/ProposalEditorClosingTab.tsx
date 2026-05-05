import { FormEvent } from "react";

interface ProposalEditorClosingTabProps {
  defaultClosingText: string;
  defaultShowSignature: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export function ProposalEditorClosingTab({
  defaultClosingText,
  defaultShowSignature,
  onSubmit,
}: ProposalEditorClosingTabProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        void onSubmit(event);
      }}
    >
      <div>
        <label className="block text-sm font-medium text-slate-700">Texto de cierre</label>
        <textarea
          name="closingText"
          defaultValue={defaultClosingText}
          rows={6}
          className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          placeholder="Escribe un mensaje final para el cliente..."
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="showSignature"
          defaultChecked={defaultShowSignature}
          className="h-4 w-4 rounded border-slate-300 text-sky-700"
        />
        Mostrar firma en el cierre
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800"
        >
          Guardar cierre
        </button>
      </div>
    </form>
  );
}
