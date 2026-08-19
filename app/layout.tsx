import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foto com André Salineiro | 22067",
  description:
    "Crie sua foto personalizada com André Salineiro, Deputado Estadual 22067.",

  openGraph: {
    title: "Foto com André Salineiro | 22067",
    description:
      "Monte sua foto personalizada e compartilhe nas redes sociais.",
    url: "https://foto-comigocd.vercel.app",
    siteName: "Foto com André Salineiro",
    images: [
  {
    url: "https://foto-comigocd.vercel.app/compartilhamento.png",
    width: 1200,
    height: 630,
    alt: "André Salineiro 22067",
  },
],

  twitter: {
  card: "summary_large_image",
  title: "Foto com André Salineiro | 22067",
  description:
    "Monte sua foto personalizada e compartilhe nas redes sociais.",
  images: ["https://foto-comigocd.vercel.app/compartilhamento.png"],
},

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}