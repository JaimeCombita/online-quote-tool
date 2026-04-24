import { Proposal, ProposalSection } from "../../domain/entities/Proposal";
import { ProposalDraftRepository } from "../../domain/repositories/ProposalDraftRepository";
import { Clock } from "../ports/Clock";

export class UpdateSectionUseCase {
  constructor(
    private readonly proposalDraftRepository: ProposalDraftRepository,
    private readonly clock: Clock,
  ) {}

  public async execute(
    proposalId: string,
    sectionId: string,
    updates: Partial<ProposalSection>,
  ): Promise<Proposal> {
    const proposal = await this.proposalDraftRepository.findById(proposalId);

    if (!proposal) {
      throw new Error(`Proposal with id ${proposalId} not found`);
    }

    const updated = proposal.updateSection(sectionId, updates, this.clock.now());
    await this.proposalDraftRepository.save(updated);
    return updated;
  }
}