import { ProposalDraftRepository } from "../../domain/repositories/ProposalDraftRepository";

export class DeleteProposalDraftUseCase {
  constructor(private readonly proposalDraftRepository: ProposalDraftRepository) {}

  public async execute(proposalId: string): Promise<void> {
    await this.proposalDraftRepository.delete(proposalId);
  }
}
