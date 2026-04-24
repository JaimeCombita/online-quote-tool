import { Proposal, ProposalProps } from "../../domain/entities/Proposal";
import { ProposalDraftRepository } from "../../domain/repositories/ProposalDraftRepository";
import { BrowserStorage } from "./BrowserStorage";

export const PROPOSAL_DRAFT_STORAGE_KEY = "propuestas-pdf:drafts";

export class BrowserProposalDraftRepository implements ProposalDraftRepository {
  constructor(private readonly storage: BrowserStorage) {}

  public async save(proposal: Proposal): Promise<void> {
    const drafts = await this.listSerialized();
    const nextDrafts = drafts.filter((draft) => draft.id !== proposal.snapshot.id);
    nextDrafts.push(proposal.snapshot);
    this.storage.write(PROPOSAL_DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts));
  }

  public async list(): Promise<Proposal[]> {
    const drafts = await this.listSerialized();
    return drafts.map((draft) => Proposal.rehydrate(draft));
  }

  public async findById(id: string): Promise<Proposal | null> {
    const drafts = await this.listSerialized();
    const draft = drafts.find((item) => item.id === id);

    return draft ? Proposal.rehydrate(draft) : null;
  }

  public async delete(id: string): Promise<void> {
    const drafts = await this.listSerialized();
    const nextDrafts = drafts.filter((draft) => draft.id !== id);
    this.storage.write(PROPOSAL_DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts));
  }

  private async listSerialized(): Promise<ProposalProps[]> {
    const content = this.storage.read(PROPOSAL_DRAFT_STORAGE_KEY);

    if (!content) {
      return [];
    }

    try {
      const parsed = JSON.parse(content) as ProposalProps[];
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed;
    } catch {
      return [];
    }
  }
}
