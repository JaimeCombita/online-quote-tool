import { Proposal } from "../../domain/entities/Proposal";
import { ProposalDraftRepository } from "../../domain/repositories/ProposalDraftRepository";

export class ListProposalDraftsUseCase {
  constructor(private readonly proposalDraftRepository: ProposalDraftRepository) {}

  public async execute(): Promise<Proposal[]> {
    return this.proposalDraftRepository.list();
  }
}
