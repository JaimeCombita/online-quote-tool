import { ProposalDashboard } from "@/modules/proposals/presentation/components/ProposalDashboard";
import { JcEngineBrandFrame } from "@/modules/shared/presentation/components/JcEngineBrandFrame";

export default function Home() {
  return (
    <JcEngineBrandFrame
      pageTag="Fase 1 · Propuestas"
      pageTitle="Generador de propuestas comerciales"
      pageSubtitle="Crea, organiza y valida propuestas con almacenamiento local, vista previa HTML y flujo preparado para PDF bajo la linea visual corporativa de JC Engine."
    >
        <ProposalDashboard />
    </JcEngineBrandFrame>
  );
}
