import { Proposal } from "../../domain/entities/Proposal";
import { ProposalDraftRepository } from "../../domain/repositories/ProposalDraftRepository";
import { Clock } from "../ports/Clock";

export class ToggleSectionVisibilityUseCase {
  constructor(
    private readonly proposalDraftRepository: ProposalDraftRepository,
    private readonly clock: Clock,
  ) {}

  public async execute(proposalId: string, sectionId: string): Promise<Proposal> {
    const proposal = await this.proposalDraftRepository.findById(proposalId);

    if (!proposal) {
      throw new Error(`Proposal with id ${proposalId} not found`);
    }

    const updated = proposal.toggleSectionVisibility(sectionId, this.clock.now());
    await this.proposalDraftRepository.save(updated);
    return updated;
  }
}