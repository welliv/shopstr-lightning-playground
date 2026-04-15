import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { scenarios } from "@/data/scenarios";
import { WALLET_PERSONAS } from "@/types/wallet";

const slides = [
  {
    title: "How Shopstr Earns",
    content: (
      <div className="flex flex-col items-center gap-6">
        <span className="text-7xl">🎁</span>
        <p className="text-center text-lg text-muted-foreground">
          Shopstr uses <strong>Wrapped Invoices</strong> to collect a small platform fee on every sale.
        </p>
        <p className="text-center text-lg text-muted-foreground">
          When a buyer pays for a product, the platform wraps the seller's invoice with a higher amount.
          The fee difference is earned — completely non-custodially.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Buyers pay the platform. Platform pays the seller. Preimage settles the chain. Done.
        </p>
      </div>
    ),
  },
  {
    title: "The Lightning Marketplace Stack",
    content: (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-8 text-5xl">
          <div className="flex flex-col items-center gap-2">
            <span>🔗</span>
            <span className="text-sm font-medium text-muted-foreground">NWC</span>
          </div>
          <div className="text-2xl text-muted-foreground">+</div>
          <div className="flex flex-col items-center gap-2">
            <span>🔌</span>
            <span className="text-sm font-medium text-muted-foreground">LNURL</span>
          </div>
          <div className="text-2xl text-muted-foreground">+</div>
          <div className="flex flex-col items-center gap-2">
            <span>🔒</span>
            <span className="text-sm font-medium text-muted-foreground">Hold Invoices</span>
          </div>
        </div>
        <p className="text-center text-lg text-muted-foreground">
          NWC connects wallets to the marketplace.
          LNURL makes seller payouts instant.
          Hold Invoices protect buyers with escrow.
        </p>
        <p className="text-center text-lg text-muted-foreground">
          Together, these three protocols power a fully decentralized, non-custodial marketplace.
        </p>
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
          <div className="flex flex-col items-center gap-2">
            <span>{WALLET_PERSONAS.david.emoji}</span>
            <span className="text-lg font-medium text-foreground">{WALLET_PERSONAS.david.name}</span>
          </div>
        </div>
        <p className="text-center text-lg text-muted-foreground">
          Connect test wallets to explore each Lightning scenario as it maps to Shopstr's marketplace.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Each scenario shows how Lightning primitives power real marketplace features.
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
                Try the first scenario &rarr;
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
