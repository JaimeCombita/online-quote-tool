"use client";

import { use } from "react";
import { ProposalEditor } from "@/modules/proposals/presentation/components/ProposalEditor";
import {
  JcEngineBrandFrame,
} from "@/modules/shared/presentation/components/JcEngineBrandFrame";

interface EditorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditorPage({ params }: EditorPageProps) {
  const { id } = use(params);

  return (
    <JcEngineBrandFrame
      pageTag="Editor"
      pageTitle="Editor de propuesta"
      pageSubtitle="Gestiona datos generales, secciones, inversion, cierre y vista previa en un flujo unificado para JC Engine."
    >
        <ProposalEditor proposalId={id} />
    </JcEngineBrandFrame>
  );
}
