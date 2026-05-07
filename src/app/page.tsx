import { ProposalDashboard } from "@/modules/proposals/presentation/components/ProposalDashboard";
import { JcEngineBrandFrame } from "@/modules/shared/presentation/components/JcEngineBrandFrame";

export default function Home() {
  return (
    <JcEngineBrandFrame
      pageTag="Propuestas Comerciales"
      pageTitle="Generador de propuestas comerciales"
      pageSubtitle="Crea, organiza y valida propuestas con almacenamiento local, vista previa y flujo preparado para PDF."
    >
        <ProposalDashboard />
    </JcEngineBrandFrame>
  );
}
