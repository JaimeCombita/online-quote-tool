import { Proposal, ProposalProps } from "../../domain/entities/Proposal";
import { ProposalDraftRepository } from "../../domain/repositories/ProposalDraftRepository";

export class SaveProposalSnapshotUseCase {
  constructor(private readonly proposalDraftRepository: ProposalDraftRepository) {}

  public async execute(snapshot: ProposalProps): Promise<Proposal> {
    const proposal = Proposal.rehydrate(snapshot);
    await this.proposalDraftRepository.save(proposal);
    return proposal;
  }
}