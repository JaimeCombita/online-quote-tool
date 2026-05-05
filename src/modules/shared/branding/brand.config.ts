type BrandLink = {
  label: string;
  href: string;
};

type BrandSocialLink = BrandLink;

export const jcBrandConfig = {
  app: {
    name: "JC Engine",
    productName: "Generador de propuestas comerciales",
    legalName: "JC Engine by Jaime Combita",
    tagline: "Arquitectura y desarrollo de software",
    description:
      "Soluciones digitales escalables con enfoque en arquitectura, seguridad y resultados de negocio.",
  },
  contact: {
    email: "leonardo.102408@gmail.com",
    phone: "+57 321 934 1908",
    city: "Bogotá, Colombia",
    copyrightYear: "2026",
  },
  links: {
    website: "https://jcengine.co/",
    nav: [
      { label: "Sitio principal", href: "https://jcengine.co/" },
      { label: "Servicios", href: "https://jcengine.co/#services" },
      { label: "Proyectos", href: "https://jcengine.co/#projects" },
    ] satisfies BrandLink[],
    social: [
      { label: "LinkedIn", href: "https://linkedin.com/in/jaimecombitavargas" },
      { label: "GitHub", href: "https://github.com/jaimecombita" },
      { label: "Instagram", href: "https://www.instagram.com/jcenginedev" },
      { label: "Facebook", href: "https://www.fb.com/jcenginedev" },
    ] satisfies BrandSocialLink[],
  },
  assets: {
    logoMain: "/brand/logo.png",
    logoMark: "/brand/logo-optimizado.png",
    favicon: "/brand/favicon-32x32.png",
    ogImage: "/brand/logonew.png",
  },
  tokens: {
    primary: {
      50: "#ecf8ff",
      100: "#d8f0ff",
      200: "#b4e3ff",
      300: "#84cfff",
      400: "#4fb6ff",
      500: "#1e90ff",
      600: "#0f78d1",
      700: "#0f5ea6",
    },
    neutral: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      950: "#020617",
    },
    background: "#f3f7fb",
    foreground: "#0f172a",
  },
};