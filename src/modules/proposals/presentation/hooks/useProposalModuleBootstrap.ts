import { useCallback, useMemo, useState } from "react";
import { createProposalModule } from "../../composition/proposalModule";
import { PROPOSAL_DRAFT_STORAGE_KEY } from "../../infrastructure/browser/BrowserProposalDraftRepository";

interface DraftSummary {
  count: number;
  lastDraftId: string;
}

const readDraftSummaryFromStorage = (): DraftSummary => {
  if (typeof window === "undefined") {
    return { count: 0, lastDraftId: "" };
  }

  const rawValue = window.localStorage.getItem(PROPOSAL_DRAFT_STORAGE_KEY);
  if (!rawValue) {
    return { count: 0, lastDraftId: "" };
  }

  try {
    const parsed = JSON.parse(rawValue) as Array<{ id?: string }>;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { count: 0, lastDraftId: "" };
    }

    return {
      count: parsed.length,
      lastDraftId: parsed[parsed.length - 1]?.id ?? "",
    };
  } catch {
    return { count: 0, lastDraftId: "" };
  }
};

export const useProposalModuleBootstrap = () => {
  const initialSummary = readDraftSummaryFromStorage();
  const [draftCount, setDraftCount] = useState<number>(initialSummary.count);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastDraftId, setLastDraftId] = useState<string>(initialSummary.lastDraftId);
  const proposalModule = useMemo(() => createProposalModule(), []);

  const refreshDrafts = useCallback(async () => {
    setLoading(true);
    const drafts = await proposalModule.listProposalDrafts.execute();
    setDraftCount(drafts.length);
    setLastDraftId(drafts[drafts.length - 1]?.snapshot.id ?? "");
    setLoading(false);
  }, [proposalModule]);

  const createDraft = useCallback(async () => {
    const draft = await proposalModule.createProposalDraft.execute();
    setLastDraftId(draft.snapshot.id);
    await refreshDrafts();
  }, [proposalModule, refreshDrafts]);

  return {
    draftCount,
    loading,
    lastDraftId,
    refreshDrafts,
    createDraft,
  };
};
