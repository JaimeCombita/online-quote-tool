import { ProposalDraftRepository } from "../../domain/repositories/ProposalDraftRepository";

export class ExportProposalUseCase {
  constructor(private readonly proposalDraftRepository: ProposalDraftRepository) {}

  public async execute(proposalId: string): Promise<string> {
    const proposal = await this.proposalDraftRepository.findById(proposalId);

    if (!proposal) {
      throw new Error(`Proposal with id ${proposalId} not found`);
    }

    return JSON.stringify(proposal.snapshot, null, 2);
  }
}
