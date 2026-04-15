import { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2,
  Zap,
  Megaphone,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useWalletStore,
  useTransactionStore,
  useZapvertiseStore,
} from "@/stores";
import { WALLET_PERSONAS } from "@/types";
import type { Nip47Notification } from "@getalby/sdk/nwc";

const MOCK_LISTINGS = [
  {
    id: "listing-1",
    title: "Nostr T-Shirt",
    author: "merchant1@getalby.com",
    currentZaps: 12,
  },
  {
    id: "listing-2",
    title: "Lightning Node Guide eBook",
    author: "merchant2@getalby.com",
    currentZaps: 5,
  },
  {
    id: "listing-3",
    title: "Hardware Wallet Starter Kit",
    author: "merchant3@getalby.com",
    currentZaps: 28,
  },
];

export function ZapvertisingScenario() {
  const { areAllWalletsConnected } = useWalletStore();
  const { reset } = useZapvertiseStore();
  const allConnected = areAllWalletsConnected(["alice", "bob", "charlie"]);

  useEffect(() => {
    reset();
  }, [reset]);

  if (!allConnected) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MerchantPanel />
      <PlatformPanel />
      <BuyerPanel />
    </div>
  );
}

function MerchantPanel() {
  const {
    state,
    selectedListing,
    boostAmount,
    setSelectedListing,
    setBoostAmount,
    setState,
  } = useZapvertiseStore();

  const handleSelectListing = (listing: (typeof MOCK_LISTINGS)[0]) => {
    setSelectedListing({
      id: listing.id,
      title: listing.title,
      author: listing.author,
      currentZaps: listing.currentZaps,
    });
    setState("listing_selected");
  };

  const handleSetBoost = () => {
    setState("boost_configured");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.charlie.emoji}</span>
          <span>Merchant: List & Boost</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "idle" && (
          <>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              <p>Select a product listing to boost with zaps.</p>
            </div>
            <div className="space-y-2">
              {MOCK_LISTINGS.map((listing) => (
                <button
                  key={listing.id}
                  onClick={() => handleSelectListing(listing)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{listing.title}</span>
                    <span className="text-xs text-muted-foreground">
                      ⚡ {listing.currentZaps} zaps
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    by {listing.author}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {state === "listing_selected" && selectedListing && (
          <>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
              <p className="font-medium">Selected: {selectedListing.title}</p>
              <p className="text-xs mt-1">
                Current zaps: {selectedListing.currentZaps}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Boost Budget (sats)
              </label>
              <Input
                type="number"
                value={boostAmount}
                onChange={(e) => setBoostAmount(parseInt(e.target.value) || 0)}
                placeholder="500"
              />
            </div>
            <Button
              onClick={handleSetBoost}
              disabled={!boostAmount || boostAmount <= 0}
              className="w-full"
            >
              <Megaphone className="mr-2 h-4 w-4" />
              Set Boost Budget
            </Button>
          </>
        )}

        {state !== "idle" && state !== "listing_selected" && selectedListing && (
          <>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                <span className="font-medium">Listing Boosted</span>
              </div>
              <p className="mt-1">{selectedListing.title}</p>
              <p className="text-xs mt-1">Budget: {boostAmount} sats</p>
            </div>
            {state === "receipt_verified" && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span className="font-medium">
                    Zap advertising complete!
                  </span>
                </div>
                <p className="mt-1 text-xs">
                  The zap receipt (kind 9735) is published to Nostr relays. Your
                  listing now shows a Boosted badge and ranks higher in search.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PlatformPanel() {
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const { getNWCClient, setWalletBalance } = useWalletStore();
  const {
    addTransaction,
    updateTransaction,
    addFlowStep,
    updateFlowStep,
    addBalanceSnapshot,
  } = useTransactionStore();
  const {
    state,
    selectedListing,
    boostAmount,
    zapRequest,
    setZapRequest,
    setZapReceipt,
    setState,
  } = useZapvertiseStore();

  const zapRequestRef = useRef(zapRequest);
  useEffect(() => {
    zapRequestRef.current = zapRequest;
  }, [zapRequest]);

  const handleNotification = useCallback(
    async (notification: Nip47Notification) => {
      const currentZapRequest = zapRequestRef.current;
      if (
        notification.notification_type === "payment_received" &&
        currentZapRequest &&
        notification.notification.payment_hash ===
          currentZapRequest.paymentHash
      ) {
        // Payment confirmed
        setState("zap_confirmed");

        addTransaction({
          type: "payment_sent",
          status: "success",
          fromWallet: "bob",
          amount: useZapvertiseStore.getState().boostAmount,
          description: `Zap payment confirmed - ${useZapvertiseStore.getState().boostAmount} sats boosted`,
          snippetIds: ["subscribe-notifications"],
        });

        addFlowStep({
          fromWallet: "bob",
          toWallet: "charlie",
          label: `⚡ Zap confirmed: ${useZapvertiseStore.getState().boostAmount} sats`,
          direction: "right",
          status: "success",
          snippetIds: ["subscribe-notifications"],
        });
      }
    },
    [addTransaction, addFlowStep, setState],
  );

  const createBoost = async () => {
    const client = getNWCClient("bob");
    if (!client) {
      setError("Platform wallet not connected");
      return;
    }

    setIsPaying(true);
    setError(null);

    const txId = addTransaction({
      type: "payment_sent",
      status: "pending",
      fromWallet: "bob",
      amount: boostAmount,
      description: `Creating zap advertising invoice for ${boostAmount} sats...`,
      snippetIds: ["make-invoice"],
    });

    try {
      // Platform (bob) creates an invoice to pay as the zap
      const response = await client.makeInvoice({
        amount: boostAmount * 1000,
        description: `Zapvertising boost for ${selectedListing?.title}`,
      });

      const decoded = await client.lookupInvoice({
        invoice: response.invoice,
      });

      const requestData = {
        invoice: response.invoice,
        paymentHash: decoded.payment_hash,
      };

      setZapRequest(requestData);
      setState("zap_sent");

      updateTransaction(txId, {
        status: "success",
        description: `Zap request (kind 9734) created for ${boostAmount} sats`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "bob",
        label: `📨 Zap request (kind 9734): ${boostAmount} sats`,
        direction: "left",
        status: "success",
        snippetIds: ["make-invoice"],
      });

      // Now pay the invoice to complete the zap
      const payTxId = addTransaction({
        type: "payment_sent",
        status: "pending",
        fromWallet: "bob",
        amount: boostAmount,
        description: `Platform paying zap invoice for ${boostAmount} sats...`,
        snippetIds: ["pay-invoice"],
      });

      const payFlowId = addFlowStep({
        fromWallet: "bob",
        toWallet: "charlie",
        label: `Paying zap invoice: ${boostAmount} sats...`,
        direction: "right",
        status: "pending",
        snippetIds: ["pay-invoice"],
      });

      // Subscribe to notifications before paying
      const unsub = await client.subscribeNotifications(handleNotification, [
        "payment_received",
      ]);
      unsubRef.current = unsub;

      // Pay the invoice from bob (platform pays on behalf of merchant)
      const buyerClient = getNWCClient("alice");
      if (buyerClient) {
        await buyerClient.payInvoice({ invoice: response.invoice });

        // Update balances
        const buyerBalance = await buyerClient.getBalance();
        const buyerBalanceSats = Math.floor(buyerBalance.balance / 1000);
        setWalletBalance("alice", buyerBalanceSats);
        addBalanceSnapshot({ walletId: "alice", balance: buyerBalanceSats });

        const bobBalance = await client.getBalance();
        const bobBalanceSats = Math.floor(bobBalance.balance / 1000);
        setWalletBalance("bob", bobBalanceSats);
        addBalanceSnapshot({ walletId: "bob", balance: bobBalanceSats });

        updateTransaction(payTxId, {
          status: "success",
          description: `Zap paid: ${boostAmount} sats via Lightning`,
        });

        updateFlowStep(payFlowId, {
          label: `✅ Zap paid: ${boostAmount} sats`,
          status: "success",
          snippetIds: ["pay-invoice"],
        });

        // Create zap receipt (kind 9735)
        const receipt = {
          preimage: decoded.payment_hash,
          amount: boostAmount,
          verified: true,
        };

        setZapReceipt(receipt);
        setState("receipt_verified");

        addFlowStep({
          fromWallet: "bob",
          toWallet: "charlie",
          label: `📋 Zap receipt (kind 9735) published`,
          direction: "right",
          status: "success",
          snippetIds: ["subscribe-notifications"],
        });
      }
    } catch (err) {
      console.error("Failed to create zap boost:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);

      updateTransaction(txId, {
        status: "error",
        description: `Failed to create zap boost: ${errorMessage}`,
      });
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.bob.emoji}</span>
          <span>Platform: Boost Service</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "idle" && (
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            <p>Waiting for merchant to select a listing and set boost...</p>
          </div>
        )}

        {state === "listing_selected" && (
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            <p>Listing selected. Waiting for boost configuration...</p>
          </div>
        )}

        {state === "boost_configured" && selectedListing && (
          <>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-purple-800 dark:text-purple-200">
              <p className="font-medium">Boost Ready</p>
              <p className="mt-1">
                {selectedListing.title} — {boostAmount} sats
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-xs font-mono space-y-1">
              <p>
                <span className="text-muted-foreground">NIP-57 Flow:</span>
              </p>
              <p>1. Resolve LNURL for merchant</p>
              <p>2. Create zap request (kind 9734)</p>
              <p>3. Pay invoice via NWC</p>
              <p>4. Publish zap receipt (kind 9735)</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={createBoost}
              disabled={isPaying}
              className="w-full"
            >
              {isPaying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Zap...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Execute Zap Boost
                </>
              )}
            </Button>
          </>
        )}

        {(state === "zap_sent" ||
          state === "zap_confirmed") && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">Processing zap payment...</span>
            </div>
            <p className="mt-1 text-xs">
              Kind-9734 zap request sent. Awaiting Lightning payment
              confirmation.
            </p>
          </div>
        )}

        {state === "receipt_verified" && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span className="font-medium">Zap Boost Complete!</span>
            </div>
            <p className="mt-1 text-xs">
              Kind-9735 zap receipt published to relays. The listing is now
              boosted.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BuyerPanel() {
  const { state, selectedListing, boostAmount } = useZapvertiseStore();

  const boostedRankings = MOCK_LISTINGS.map((listing) => {
    if (selectedListing && listing.id === selectedListing.id) {
      return {
        ...listing,
        currentZaps: listing.currentZaps + (state === "receipt_verified" ? 1 : 0),
        boosted: state === "receipt_verified",
      };
    }
    return { ...listing, boosted: false };
  }).sort((a, b) => {
    if (a.boosted && !b.boosted) return -1;
    if (!a.boosted && b.boosted) return 1;
    return b.currentZaps - a.currentZaps;
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.alice.emoji}</span>
          <span>Buyer: Marketplace Feed</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "idle" && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
            <p>
              Buyers see listings ranked by zap count. Boosted items appear at
              the top.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            Marketplace Feed (ranked by zaps)
          </p>
          {boostedRankings.map((listing, index) => (
            <div
              key={listing.id}
              className={`p-3 border rounded-lg ${
                listing.boosted
                  ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    #{index + 1}
                  </span>
                  <span className="font-medium text-sm">{listing.title}</span>
                  {listing.boosted && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full">
                      ⚡ Boosted
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>⚡ {listing.currentZaps} zaps</span>
                <span>{listing.author}</span>
              </div>
            </div>
          ))}
        </div>

        {state === "receipt_verified" && selectedListing && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="font-medium">"{selectedListing.title}" is now boosted!</span>
            </div>
            <p className="mt-1 text-xs">
              The {boostAmount} sats zap created a kind-9735 receipt on Nostr
              relays. The listing now ranks #1 with a Boosted badge.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
