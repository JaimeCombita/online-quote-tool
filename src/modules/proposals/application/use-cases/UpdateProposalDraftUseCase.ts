import { Proposal, ProposalMetadata, ProposalClientInfo, ProposalIssuerProfile, ProposalInvestment } from "../../domain/entities/Proposal";
import { ProposalDraftRepository } from "../../domain/repositories/ProposalDraftRepository";
import { Clock } from "../ports/Clock";

export type UpdateProposalDraftInput = {
  proposalId: string;
  metadata?: Partial<ProposalMetadata>;
  client?: Partial<ProposalClientInfo>;
  issuer?: Partial<ProposalIssuerProfile>;
  investment?: Partial<ProposalInvestment>;
  closingText?: string;
  showSignature?: boolean;
};

export class UpdateProposalDraftUseCase {
  constructor(
    private readonly proposalDraftRepository: ProposalDraftRepository,
    private readonly clock: Clock,
  ) {}

  public async execute(input: UpdateProposalDraftInput): Promise<Proposal> {
    const proposal = await this.proposalDraftRepository.findById(input.proposalId);

    if (!proposal) {
      throw new Error(`Proposal with id ${input.proposalId} not found`);
    }

    let updated = proposal;

    if (input.metadata) {
      updated = updated.updateMetadata(input.metadata, this.clock.now());
    }

    if (input.client) {
      updated = updated.updateClient(input.client, this.clock.now());
    }

    if (input.issuer) {
      updated = updated.updateIssuer(input.issuer, this.clock.now());
    }

    if (input.investment) {
      updated = updated.updateInvestment(input.investment, this.clock.now());
    }

    if (input.closingText !== undefined || input.showSignature !== undefined) {
      const closingText = input.closingText ?? proposal.snapshot.closingText ?? "";
      const showSignature = input.showSignature ?? proposal.snapshot.showSignature;
      updated = updated.updateClosing(closingText, showSignature, this.clock.now());
    }

    await this.proposalDraftRepository.save(updated);
    return updated;
  }
}
