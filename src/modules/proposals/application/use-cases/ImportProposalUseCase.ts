import { ProposalProps, Proposal } from "../../domain/entities/Proposal";
import { ProposalDraftRepository } from "../../domain/repositories/ProposalDraftRepository";

export class ImportProposalUseCase {
  constructor(private readonly proposalDraftRepository: ProposalDraftRepository) {}

  public async execute(jsonString: string): Promise<Proposal> {
    try {
      const data = JSON.parse(jsonString) as ProposalProps;
      
      // Basic validation
      if (!data.id || !data.metadata || !data.client || !data.issuer) {
        throw new Error("Invalid proposal JSON structure");
      }

      const proposal = Proposal.rehydrate(data);
      await this.proposalDraftRepository.save(proposal);
      return proposal;
    } catch (error) {
      throw new Error(`Failed to import proposal: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
