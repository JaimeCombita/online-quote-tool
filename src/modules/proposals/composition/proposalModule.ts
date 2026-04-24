import { CreateProposalDraftUseCase } from "../application/use-cases/CreateProposalDraftUseCase";
import { ListProposalDraftsUseCase } from "../application/use-cases/ListProposalDraftsUseCase";
import { UpdateProposalDraftUseCase } from "../application/use-cases/UpdateProposalDraftUseCase";
import { DeleteProposalDraftUseCase } from "../application/use-cases/DeleteProposalDraftUseCase";
import { AddSectionUseCase } from "../application/use-cases/AddSectionUseCase";
import { DeleteSectionUseCase } from "../application/use-cases/DeleteSectionUseCase";
import { MoveSectionUseCase } from "../application/use-cases/MoveSectionUseCase";
import { UpdateSectionUseCase } from "../application/use-cases/UpdateSectionUseCase";
import { ToggleSectionVisibilityUseCase } from "../application/use-cases/ToggleSectionVisibilityUseCase";
import { ExportProposalUseCase } from "../application/use-cases/ExportProposalUseCase";
import { ImportProposalUseCase } from "../application/use-cases/ImportProposalUseCase";
import { SaveProposalSnapshotUseCase } from "../application/use-cases/SaveProposalSnapshotUseCase";
import { BrowserProposalDraftRepository } from "../infrastructure/browser/BrowserProposalDraftRepository";
import { BrowserStorage } from "../infrastructure/browser/BrowserStorage";
import { SystemClock } from "../infrastructure/system/SystemClock";
import { UuidGenerator } from "../infrastructure/system/UuidGenerator";

export const createProposalModule = () => {
  const repository = new BrowserProposalDraftRepository(new BrowserStorage());
  const idGenerator = new UuidGenerator();
  const clock = new SystemClock();

  return {
    createProposalDraft: new CreateProposalDraftUseCase(repository, idGenerator, clock),
    listProposalDrafts: new ListProposalDraftsUseCase(repository),
    updateProposalDraft: new UpdateProposalDraftUseCase(repository, clock),
    deleteProposalDraft: new DeleteProposalDraftUseCase(repository),
    addSection: new AddSectionUseCase(repository, clock),
    deleteSection: new DeleteSectionUseCase(repository, clock),
    moveSection: new MoveSectionUseCase(repository, clock),
    updateSection: new UpdateSectionUseCase(repository, clock),
    toggleSectionVisibility: new ToggleSectionVisibilityUseCase(repository, clock),
    saveProposalSnapshot: new SaveProposalSnapshotUseCase(repository),
    exportProposal: new ExportProposalUseCase(repository),
    importProposal: new ImportProposalUseCase(repository),
  };
};
