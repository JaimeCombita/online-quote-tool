import { Proposal } from "../../domain/entities/Proposal";
import { ProposalDraftRepository } from "../../domain/repositories/ProposalDraftRepository";
import { Clock } from "../ports/Clock";
import { IdGenerator } from "../ports/IdGenerator";

export class CreateProposalDraftUseCase {
  constructor(
    private readonly proposalDraftRepository: ProposalDraftRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  public async execute(): Promise<Proposal> {
    const proposal = Proposal.createEmpty(this.idGenerator.generate(), this.clock.now());
    await this.proposalDraftRepository.save(proposal);
    return proposal;
  }
}
