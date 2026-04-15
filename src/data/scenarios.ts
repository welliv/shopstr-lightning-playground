import type { Scenario, ScenarioComplexity, ScenarioSection } from "@/types";
import type { SnippetId } from "@/data/code-snippets";

const unorderedScenarios: Scenario[] = [
  // === CORE SCENARIOS ===
  {
    id: "marketplace-checkout",
    title: "Marketplace Checkout",
    description:
      "A buyer discovers a product, verifies the seller's identity, and pays. The platform routes payment via Lightning Address and delivers the order privately via gift-wrap.",
    education:
      "Every Shopstr purchase involves three protocols working together: NIP-05 verifies the seller is who they claim to be, Lightning Address (LUD-16) provides a fresh invoice without expiry, and NIP-59 gift-wrap keeps order details private from relays. Buyers can pay via Lightning (NWC) or Cashu (eCash) — both paths feed into the same checkout flow.",
    complexity: "simplest",
    requiredWallets: ["alice", "bob"],
    icon: "💸",
    snippetIds: ["make-invoice", "pay-invoice", "fetch-lightning-address"] satisfies SnippetId[],
    howItWorks: [
      { title: "Discover", description: "Buyer finds product listing on Nostr relays (NIP-23)." },
      { title: "Verify", description: "Buyer checks seller's NIP-05 verified identity." },
      { title: "Invoice", description: "Platform fetches fresh invoice from seller's Lightning Address." },
      { title: "Pay", description: "Buyer pays via NWC or Cashu." },
      { title: "Deliver", description: "Order details gift-wrapped to seller (NIP-59 + NIP-44)." },
    ],
    prompts: [
      {
        title: "Marketplace Checkout Flow",
        description: "Build a marketplace checkout that verifies sellers and processes payments.",
        prompt: `Build a marketplace checkout flow that verifies seller identity and processes Lightning payments.

Requirements:
- Display a product listing with title, price, and seller info
- Show a NIP-05 verified badge next to the seller's name
- Fetch a fresh invoice from the seller's Lightning Address when buyer clicks "Buy"
- Display the invoice as a QR code for manual payment
- Also offer a "Pay with Wallet" button for NWC-connected buyers
- Poll for payment confirmation and show success state
- After payment, gift-wrap the order details and send to the seller
- Show the buyer a receipt with the preimage as proof of payment
- Use React and TypeScript

The flow: Discover product → verify seller → fetch invoice → pay → gift-wrap order → confirmation.`,
      },
    ],
  },
  {
    id: "platform-fee",
    title: "Platform Fee",
    description:
      "How Shopstr earns without holding anyone's money. The platform wraps the seller's invoice with a fee using the same payment hash — non-custodial value extraction at the protocol level.",
    education:
      "Wrapped invoices are the Lightning protocol equivalent of a router fee. Shopstr creates a hold invoice with the SAME payment hash as the seller's invoice but a HIGHER amount (seller price + fee). When the buyer pays the wrapped invoice, funds are locked in the Lightning network — not in Shopstr's wallet. Shopstr then pays the seller's original invoice from its own funds, gets the preimage, and uses it to settle the held payment — keeping the fee difference. This is non-custodial: Shopstr never holds the buyer's funds.",
    complexity: "advanced",
    requiredWallets: ["alice", "bob", "charlie"],
    icon: "💰",
    snippetIds: [
      "wrapped-hold-invoice",
      "subscribe-hold-notifications",
      "pay-invoice",
      "hold-invoice-settle",
    ] satisfies SnippetId[],
    howItWorks: [
      { title: "Seller Invoice", description: "Seller creates invoice for 1,000 sats." },
      { title: "Wrap", description: "Platform extracts payment hash, creates hold invoice for 1,010 sats (1% fee) with same hash." },
      { title: "Buyer Pays", description: "Buyer pays 1,010 sats. Funds locked in Lightning network." },
      { title: "Platform Pays Seller", description: "Platform pays seller's original 1,000 sats from own wallet." },
      { title: "Settle", description: "Platform uses preimage to settle held payment. Keeps 10 sats fee." },
    ],
    prompts: [
      {
        title: "Wrapped Invoice Fee Router",
        description: "Build a non-custodial fee router using wrapped hold invoices.",
        prompt: `Build a fee router that wraps invoices to extract a platform fee.

Requirements:
- Three roles: Seller, Platform, Buyer
- Seller creates a regular invoice for 1000 sats
- Platform extracts the payment hash from seller's invoice
- Platform creates a hold invoice with same hash but 1010 sats (1% fee)
- Buyer pays the wrapped 1010 sats invoice → funds locked
- Platform subscribes to hold_invoice_accepted notification
- When received, platform pays seller's 1000 sats invoice
- Platform gets preimage from paying seller
- Platform settles held payment with preimage, keeping 10 sats
- Show the state machine: idle → wrapped → paid → settled
- Use React and TypeScript
- Include the fallback note: if hold invoices aren't supported, add fee to mint quote

The flow: Seller invoice → wrap with fee → buyer pays → platform pays seller → settle hold → fee earned.`,
      },
    ],
  },
  {
    id: "seller-payout",
    title: "Seller Payout + Alerts",
    description:
      "How sellers receive money instantly and know about sales in real-time. NWC notifications push alerts the moment payment arrives — no polling, no page refresh.",
    education:
      "When Shopstr pays a seller via their Lightning Address, the seller's NWC-connected wallet fires a payment_received notification instantly. This is push-based — the seller doesn't need to check anything. As a backup, Shopstr also sends a gift-wrapped DM (NIP-59) with order details. Both delivery mechanisms work simultaneously: NWC for speed, gift-wrap for reliability.",
    complexity: "simple",
    requiredWallets: ["alice", "bob"],
    icon: "🏪",
    snippetIds: [
      "subscribe-notifications",
      "pay-lightning-address",
      "pay-invoice",
    ] satisfies SnippetId[],
    howItWorks: [
      { title: "Subscribe", description: "Platform subscribes to seller's NWC wallet for payment_received notifications." },
      { title: "Sale Happens", description: "A buyer completes checkout (from Scenario 1 or 2)." },
      { title: "Pay Seller", description: "Platform pays seller via Lightning Address." },
      { title: "Notification Fires", description: "Seller's wallet receives instant push: 'Payment received: 1,000 sats'." },
      { title: "Order DM", description: "Platform also gift-wraps order details to seller (NIP-59)." },
    ],
    prompts: [
      {
        title: "Real-Time Sale Alerts",
        description: "Build a seller dashboard with instant payment notifications.",
        prompt: `Build a seller notification system using NWC subscriptions.

Requirements:
- Seller connects their NWC wallet
- Subscribe to payment_received notifications on the seller's wallet
- When a payment arrives, show a toast notification with amount
- Display a running list of recent sales with timestamps
- Also send a gift-wrapped DM with order details as backup
- Show the dual delivery: NWC notification (instant) + DM (reliable)
- Include a total earnings counter
- Use React and TypeScript

The flow: Seller connects wallet → subscribes to notifications → sale happens → instant alert + DM backup.`,
      },
    ],
  },
  {
    id: "buyer-escrow",
    title: "Buyer Escrow",
    description:
      "How hold invoices protect buyers until delivery is confirmed. Funds are locked in the Lightning network — not in any wallet — until the buyer releases them or the order is cancelled.",
    education:
      "Hold invoices lock funds without giving them to anyone. The buyer pays, but the money sits in the Lightning network until the platform decides to settle (buyer confirms delivery) or cancel (dispute/timeout). This is true escrow: no single party controls the funds during the hold period. Combined with wrapped invoices (Scenario 2), Shopstr can offer escrow AND earn a fee on the same transaction.",
    complexity: "advanced",
    requiredWallets: ["alice", "bob"],
    icon: "🔒",
    snippetIds: [
      "hold-invoice",
      "subscribe-hold-notifications",
      "hold-invoice-settle",
      "hold-invoice-cancel",
      "pay-invoice",
    ] satisfies SnippetId[],
    howItWorks: [
      { title: "Generate", description: "Platform generates preimage + SHA-256 hash." },
      { title: "Create Hold", description: "Platform creates hold invoice with the hash." },
      { title: "Buyer Pays", description: "Funds locked in Lightning network. 🔒" },
      { title: "Seller Ships", description: "Platform gift-wraps 'payment held, ship now' to seller." },
      { title: "Settle or Cancel", description: "Buyer confirms → settle with preimage. Dispute → cancel → auto-refund." },
    ],
    prompts: [
      {
        title: "Escrow Checkout",
        description: "Build an escrow system using hold invoices with settle/cancel.",
        prompt: `Build a buyer escrow system using hold invoices.

Requirements:
- Generate a random preimage and SHA-256 hash
- Create a hold invoice with the hash (not the preimage)
- Buyer pays → funds locked (show 🔒 indicator)
- Show order lifecycle: Paid → Held → Shipped → Delivered → Released
- "Release Funds" button → settleHoldInvoice with preimage
- "Cancel Order" button → cancelHoldInvoice → buyer auto-refunded
- Show timer: how long funds have been held
- Timeout handling: if no action after 7 days, auto-cancel
- Use React and TypeScript

The flow: Generate hash → create hold → buyer pays → funds locked → seller ships → settle or cancel.`,
      },
    ],
  },
  {
    id: "zapvertising",
    title: "Zapvertising",
    description:
      "How merchants pay for visibility via Lightning zaps. The zap IS the ad — no ad network, no approval, no tracking. Boosted listings rank higher in marketplace feeds.",
    education:
      "Zapvertising uses NIP-57 Lightning Zaps for permissionless advertising. A merchant zaps their listing to boost visibility. The zap creates a kind-9735 receipt on Nostr relays, which ranking algorithms use to surface boosted content. Shopstr takes a 5% cut of boost revenue. Unlike traditional advertising, there's no intermediary — direct Lightning payment, instant settlement, pseudonymous. The risk is all-pay auction dynamics: merchants may over-compete for visibility.",
    complexity: "advanced",
    requiredWallets: ["alice", "bob", "charlie"],
    icon: "📢",
    snippetIds: [
      "make-invoice",
      "pay-invoice",
      "subscribe-notifications",
    ] satisfies SnippetId[],
    howItWorks: [
      { title: "List", description: "Merchant has a product listing on Shopstr." },
      { title: "Boost", description: "Merchant sets boost amount (e.g., 500 sats). Shopstr takes 5% fee." },
      { title: "Zap", description: "Platform creates NIP-57 zap request (kind 9734) and pays via NWC." },
      { title: "Receipt", description: "Kind-9735 zap receipt published to relays. Public proof of boost." },
      { title: "Rank", description: "Boosted listings appear higher. Buyers can also zap organically." },
    ],
    prompts: [
      {
        title: "Zapvertising Marketplace",
        description: "Build a marketplace where merchants boost listings with zaps.",
        prompt: `Build a Zapvertising system where merchants boost listings with Lightning zaps.

Requirements:
- Display a marketplace feed of product listings
- Each listing shows current zap count
- "Boost This Listing" button for merchants
- Merchant enters boost amount (e.g., 500 sats)
- Shopstr takes 5% fee (25 sats), rest goes to listing boost
- Create NIP-57 zap request (kind 9734) targeting the listing event
- Pay the zap invoice via NWC
- Zap receipt (kind 9735) published to relays
- Feed sorts by zap count — boosted items at top
- Show "⚡ Boosted" badge with total zaps
- Buyers can also zap to organically boost
- Use React and TypeScript

The flow: Select listing → set boost → pay zap → receipt published → listing boosted → feed re-sorts.`,
      },
    ],
  },
  // === INFRASTRUCTURE ===
  {
    id: "l402-api-payments",
    title: "L402 API Payments",
    description:
      "How Shopstr earns from AI agents calling the MCP API. Every HTTP request can carry a payment — no API keys, no accounts, no rate limits. The sats ARE the authentication.",
    education:
      "L402 (formerly LSAT) combines HTTP 402 Payment Required with Lightning invoices. When an AI agent requests a Shopstr API endpoint, the server responds with a 402 status and a Lightning invoice. The fetch402 helper automatically pays the invoice and retries with a proof-of-payment header. This turns every API call into revenue: product lookup costs 5 sats, order creation costs 10 sats, payment verification costs 1 sat. No API keys to manage, no OAuth flows, no rate limiting infrastructure — the price IS the rate limiter.",
    complexity: "medium",
    requiredWallets: ["alice", "bob"],
    section: "infrastructure",
    icon: "🔐",
    snippetIds: ["fetch-with-l402"] satisfies SnippetId[],
    howItWorks: [
      { title: "Request", description: "AI agent sends HTTP GET to Shopstr MCP API endpoint." },
      { title: "402", description: "Server returns HTTP 402 with Lightning invoice (5 sats for product lookup)." },
      { title: "Pay", description: "fetch402 helper auto-pays invoice via agent's NWC wallet." },
      { title: "Retry", description: "Request retried with preimage in header as proof of payment." },
      { title: "Response", description: "Server verifies payment, returns data. Shopstr earns 5 sats." },
    ],
    prompts: [
      {
        title: "L402 MCP API",
        description: "Build an L402-protected API endpoint that charges per call.",
        prompt: `Build an L402-protected API that charges Lightning for each call.

Requirements:
- Create a simple product listing API endpoint
- When called without payment, return HTTP 402 with Lightning invoice
- Client uses fetch402 to auto-pay and retry
- Different prices per endpoint: products (5 sats), create-order (10 sats), verify (1 sat)
- Show the client-side: one fetch402 call handles everything
- Show the server-side: invoice generation, payment verification, content delivery
- Display running total of sats earned per session
- Use React and TypeScript for the client demo

The flow: Agent calls API → 402 + invoice → fetch402 pays → retry with proof → data delivered.`,
      },
    ],
  },

  // === BITCOIN CONNECT ===
  {
    id: "bitcoin-connect-button",
    title: "Button",
    description:
      "Add a single button component to let marketplace users connect their Lightning wallet",
    education:
      "The Bitcoin Connect Button is the simplest way to add Lightning wallet connectivity to your marketplace. Just drop in the <Button /> component and it handles everything: showing a connect button, opening the wallet selection modal, and displaying the connected wallet's balance. Perfect for letting buyers and sellers connect their wallets on Shopstr.",
    icon: "⚡",
    section: "bitcoin-connect",
    complexity: "simplest",
    requiredWallets: ["alice", "bob"],
    snippetIds: ["bc-init", "bc-button"] satisfies SnippetId[],
  },
  {
    id: "connect-wallet",
    title: "Connect Modal",
    description:
      "Programmatically launch a modal to let marketplace users connect their Lightning wallet",
    education:
      "Bitcoin Connect provides a universal wallet connection modal that supports multiple wallet types including NWC, browser extensions, and mobile apps. It abstracts away the complexity of wallet integration, making it easy to add Lightning payments to any marketplace application on Shopstr.",
    icon: "🔗",
    section: "bitcoin-connect",
    complexity: "simple",
    requiredWallets: ["alice", "bob"],
    snippetIds: ["bc-init", "bc-launch-modal", "bc-disconnect"] satisfies SnippetId[],
  },
  {
    id: "pay-button",
    title: "Pay Button",
    description:
      "A button component that launches the payment modal for marketplace checkout flows",
    education:
      "The PayButton component provides a one-click payment experience for marketplace checkout. Pass an invoice and it handles everything: showing the payment modal with QR code, connecting wallet if needed, and completing the payment. Perfect for product checkout and instant purchases on Shopstr.",
    icon: "💸",
    section: "bitcoin-connect",
    complexity: "medium",
    requiredWallets: ["alice", "bob"],
    snippetIds: ["bc-init", "bc-pay-button"] satisfies SnippetId[],
  },
  {
    id: "payment-modal",
    title: "Payment Modal",
    description: "Programmatically launch a modal to process marketplace payments",
    education:
      "The launchPaymentModal function gives you programmatic control over the marketplace payment flow. It returns a setPaid function for marking external payments (like QR code scans), and fires callbacks when payment completes or is cancelled. Ideal for custom checkout flows and dynamic invoice generation on Shopstr.",
    icon: "🪟",
    section: "bitcoin-connect",
    complexity: "medium",
    requiredWallets: ["alice", "bob"],
    snippetIds: ["bc-init", "bc-launch-payment-modal"] satisfies SnippetId[],
  },
];

const getComplexityIndex = (complexity: ScenarioComplexity) => {
  switch (complexity) {
    case "simplest":
      return 0;
    case "simple":
      return 1;
    case "medium":
      return 2;
    case "advanced":
      return 3;
    case "expert":
      return 4;
  }
};

const getSectionIndex = (section?: ScenarioSection) => {
  if (!section || section === "scenarios") return 0;
  if (section === "infrastructure") return 1;
  return 2; // bitcoin-connect
};

export const scenarios = unorderedScenarios.sort((a, b) => {
  // First sort by section
  const sectionDiff = getSectionIndex(a.section) - getSectionIndex(b.section);
  if (sectionDiff !== 0) return sectionDiff;
  // Then sort by complexity within each section
  return getComplexityIndex(a.complexity) - getComplexityIndex(b.complexity);
});

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}
