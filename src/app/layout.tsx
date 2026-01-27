import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ModalListener } from "../components/ModalListener";
import { Providers } from "../components/Providers";
import MiniFooter from "@/components/ui/MiniFooter";

// Configuração da fonte Poppins com todos os pesos
const poppins = localFont({
  src: [
    {
      path: "../../public/Poppins/Poppins-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/Poppins/Poppins-ThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../../public/Poppins/Poppins-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/Poppins/Poppins-ExtraLightItalic.ttf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../../public/Poppins/Poppins-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/Poppins/Poppins-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../public/Poppins/Poppins-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/Poppins/Poppins-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/Poppins/Poppins-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/Poppins/Poppins-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../public/Poppins/Poppins-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/Poppins/Poppins-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../public/Poppins/Poppins-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/Poppins/Poppins-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../public/Poppins/Poppins-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/Poppins/Poppins-ExtraBoldItalic.ttf",
      weight: "800",
      style: "italic",
    },
    {
      path: "../../public/Poppins/Poppins-Black.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/Poppins/Poppins-BlackItalic.ttf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GoPro2",
  description: "Plataforma de gestão de Projetos e Produtos",
  icons: {
    icon: '/Logos/logo_innovatis_preta.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <Providers>
          <div className="flex-1">
            {children}
          </div>
          <MiniFooter />
          <ModalListener />
        </Providers>
      </body>
    </html>
  );
}
