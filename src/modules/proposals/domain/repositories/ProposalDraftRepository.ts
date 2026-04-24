import { Proposal } from "../entities/Proposal";

export interface ProposalDraftRepository {
  save(proposal: Proposal): Promise<void>;
  list(): Promise<Proposal[]>;
  findById(id: string): Promise<Proposal | null>;
  delete(id: string): Promise<void>;
}
