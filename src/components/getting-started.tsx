import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { scenarios } from "@/data/scenarios";
import { WALLET_PERSONAS } from "@/types/wallet";

const slides = [
  {
    title: "How Shopstr Works",
    content: (
      <div className="flex flex-col items-center gap-6">
        <span className="text-7xl">🏪</span>
        <p className="text-center text-lg text-muted-foreground">
          A non-custodial Bitcoin marketplace built on Nostr + Lightning.
        </p>
        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground max-w-md">
          <div className="flex items-center gap-3">
            <span>📦</span><span>Seller lists product on Nostr relays (NIP-23)</span>
          </div>
          <div className="flex items-center gap-3">
            <span>🔍</span><span>Buyer discovers listing via marketplace feed</span>
          </div>
          <div className="flex items-center gap-3">
            <span>✅</span><span>Verify seller identity (NIP-05)</span>
          </div>
          <div className="flex items-center gap-3">
            <span>💸</span><span>Buyer pays via Lightning (NWC) or Cashu (eCash)</span>
          </div>
          <div className="flex items-center gap-3">
            <span>🎁</span><span>Order gift-wrapped to seller (NIP-59 + NIP-44)</span>
          </div>
          <div className="flex items-center gap-3">
            <span>🔔</span><span>Seller gets instant notification (NWC push)</span>
          </div>
          <div className="flex items-center gap-3">
            <span>📦</span><span>Seller ships product to buyer</span>
          </div>
          <div className="flex items-center gap-3">
            <span>✅</span><span>Buyer confirms delivery, funds released</span>
          </div>
          <div className="flex items-center gap-3">
            <span>⭐</span><span>Buyer leaves review (Nostr event)</span>
          </div>
          <div className="flex items-center gap-3">
            <span>📢</span><span>Merchant boosts listing via Zapvertising</span>
          </div>
          <div className="flex items-center gap-3">
            <span>🔐</span><span>AI agents call MCP API (L402 payments)</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "How Shopstr Earns",
    content: (
      <div className="flex flex-col items-center gap-6">
        <span className="text-7xl">💰</span>
        <p className="text-center text-lg text-muted-foreground">
          Three Bitcoin-native revenue streams. No Stripe. No fiat billing.
        </p>
        <div className="flex flex-col gap-4 text-sm max-w-md">
          <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="font-medium">Transaction Fee (1%)</p>
              <p className="text-muted-foreground">
                Wrapped invoices collect 1% on every sale. Non-custodial: funds locked in Lightning network, never in Shopstr's wallet.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
            <span className="text-2xl">🔐</span>
            <div>
              <p className="font-medium">API Fee (L402)</p>
              <p className="text-muted-foreground">
                AI agents pay per API call via L402. Product lookup: 5 sats. Order creation: 10 sats. Payment verification: 1 sat.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
            <span className="text-2xl">📢</span>
            <div>
              <p className="font-medium">Boost Fee (5%)</p>
              <p className="text-muted-foreground">
                Merchants zap listings for visibility. Shopstr takes 5% of boost revenue. The zap IS the ad.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Try It Live",
    content: (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-6 text-5xl">
          <div className="flex flex-col items-center gap-2">
            <span>{WALLET_PERSONAS.alice.emoji}</span>
            <span className="text-lg font-medium text-foreground">{WALLET_PERSONAS.alice.name}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span>{WALLET_PERSONAS.bob.emoji}</span>
            <span className="text-lg font-medium text-foreground">{WALLET_PERSONAS.bob.name}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span>{WALLET_PERSONAS.charlie.emoji}</span>
            <span className="text-lg font-medium text-foreground">{WALLET_PERSONAS.charlie.name}</span>
          </div>
        </div>
        <p className="text-center text-lg text-muted-foreground">
          Connect test wallets, pick a scenario, and click through each step.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Each scenario maps to a real Shopstr marketplace feature.
        </p>
      </div>
    ),
  },
];

export function GettingStarted() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="flex h-full items-center justify-center overflow-auto p-6">
      <div className="flex max-w-2xl flex-col items-center gap-10">
        <div
          key={currentSlide}
          className="flex h-96 animate-in fade-in duration-300 flex-col items-center justify-center gap-6"
        >
          <h1 className="text-3xl font-bold text-center">
            {slides[currentSlide].title}
          </h1>
          {slides[currentSlide].content}
        </div>

        <div className="flex flex-col items-center gap-6">
          {isLastSlide ? (
            <Button asChild>
              <Link to={`/${scenarios[0].id}`}>
                Try Marketplace Checkout &rarr;
              </Link>
            </Button>
          ) : (
            <Button onClick={() => setCurrentSlide((s) => s + 1)}>
              Next &rarr;
            </Button>
          )}

          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === currentSlide ? "bg-primary" : "bg-muted"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
