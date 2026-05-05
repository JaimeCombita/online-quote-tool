import { useEffect, useRef } from "react";
import { createProposalModule } from "../../../composition/proposalModule";
import { Proposal } from "../../../domain/entities/Proposal";

interface UseEditorAutoSaveParams {
  proposal: Proposal | null;
  proposalModule: ReturnType<typeof createProposalModule>;
  setAutoSaveStatus: React.Dispatch<React.SetStateAction<"idle" | "saving" | "saved">>;
}

export const useEditorAutoSave = ({
  proposal,
  proposalModule,
  setAutoSaveStatus,
}: UseEditorAutoSaveParams): void => {
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedAutoSave = useRef(false);

  useEffect(() => {
    if (!proposal) {
      return;
    }

    if (!hasInitializedAutoSave.current) {
      hasInitializedAutoSave.current = true;
      return;
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        setAutoSaveStatus("saving");
        await proposalModule.saveProposalSnapshot.execute(proposal.snapshot);
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      } catch {
        setAutoSaveStatus("idle");
      }
    }, 1000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [proposal, proposalModule, setAutoSaveStatus]);
};
