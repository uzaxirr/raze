import { Suspense } from "react";
import { Metadata } from "next";
import WalletProvider from "./WalletProvider";
import SignClient from "./SignClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Raze — Sign Transaction",
    description: "Sign your Solana transaction securely.",
    openGraph: {
      title: "Raze — Sign Transaction",
      description: "Sign your Solana transaction securely via Raze.",
      url: `https://raze.fun/sign/${id}`,
    },
  };
}

export default async function SignPage({ params }: Props) {
  const { id } = await params;

  return (
    <WalletProvider>
      <Suspense fallback={
        <div style={{ minHeight: "100vh", background: "#FAFAFE", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
          loading...
        </div>
      }>
        <SignClient id={id} />
      </Suspense>
    </WalletProvider>
  );
}
