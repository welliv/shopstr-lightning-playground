import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Globe, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore, useTransactionStore, useL402Store } from "@/stores";
import type { Nip47Notification } from "@getalby/sdk/nwc";

const ENDPOINTS = [
  { path: "/api/mcp/products", label: "Product Lookup", price: 5 },
  { path: "/api/mcp/create-order", label: "Create Order", price: 10 },
  { path: "/api/mcp/verify", label: "Verify Payment", price: 1 },
];

export function L402ApiScenario() {
  const { areAllWalletsConnected } = useWalletStore();
  const { reset } = useL402Store();
  const allConnected = areAllWalletsConnected(["alice", "bob"]);

  useEffect(() => {
    reset();
  }, [reset]);

  if (!allConnected) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <AgentPanel />
      <ServerPanel />
      <FlowPanel />
    </div>
  );
}

function AgentPanel() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const { getNWCClient, setWalletBalance } = useWalletStore();
  const { addTransaction, updateTransaction, addFlowStep, updateFlowStep, addBalanceSnapshot } =
    useTransactionStore();
  const {
    state,
    endpoint,
    price,
    totalSpent,
    setEndpoint,
    setPrice,
    setInvoice,
    setPreimage,
    setResponseData,
    addSpent,
    setState,
  } = useL402Store();

  const handleNotification = useCallback(
    async (_notification: Nip47Notification) => {
    },
    []
  );

  const handleSelectEndpoint = (ep: (typeof ENDPOINTS)[0]) => {
    setEndpoint(ep.path);
    setPrice(ep.price);
    setState("idle");
    setInvoice(null);
    setPreimage(null);
    setResponseData(null);
    setError(null);
  };

  const handleFetch = async () => {
    const client = getNWCClient("alice");
    if (!client) {
      setError("Agent wallet not connected");
      return;
    }

    setIsRequesting(true);
    setError(null);

    // Step 1: Agent sends request (simulated 402)
    const txId = addTransaction({
      type: "payment_sent",
      status: "pending",
      fromWallet: "alice",
      amount: price,
      description: `Agent requesting ${endpoint}...`,
      snippetIds: [],
    });

    addFlowStep({
      fromWallet: "alice",
      toWallet: "bob",
      label: `🤖 Request: GET ${endpoint}`,
      direction: "right",
      status: "pending",
      snippetIds: [],
    });

    setState("requested");

    try {
      // Step 2: Server returns 402 with invoice
      await new Promise((r) => setTimeout(r, 800));

      const bobClient = getNWCClient("bob");
      if (!bobClient) throw new Error("Server wallet not connected");

      const invoiceResponse = await bobClient.makeInvoice({
        amount: price * 1000,
        description: `L402: ${endpoint}`,
      });

      setInvoice(invoiceResponse.invoice);
      setState("invoice_received");

      updateTransaction(txId, {
        description: `Server returned 402 + invoice for ${price} sats`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: `⚡ 402: invoice for ${price} sats`,
        direction: "left",
        status: "success",
        snippetIds: ["fetch-with-l402"],
      });

      // Step 3: fetch402 auto-pays
      const payTxId = addTransaction({
        type: "payment_sent",
        status: "pending",
        fromWallet: "alice",
        amount: price,
        description: `fetch402 paying ${price} sats...`,
        snippetIds: ["pay-invoice"],
      });

      const payFlowId = addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: `💰 fetch402 paying: ${price} sats...`,
        direction: "right",
        status: "pending",
        snippetIds: ["fetch-with-l402"],
      });

      const unsub = await client.subscribeNotifications(handleNotification, [
        "payment_received",
      ]);
      unsubRef.current = unsub;

      const payResult = await client.payInvoice({
        invoice: invoiceResponse.invoice,
      });

      setPreimage(payResult.preimage);
      setState("paid");
      addSpent(price);

      // Update balances
      const aliceBalance = await client.getBalance();
      setWalletBalance("alice", Math.floor(aliceBalance.balance / 1000));
      addBalanceSnapshot({ walletId: "alice", balance: Math.floor(aliceBalance.balance / 1000) });

      const bobBalance = await bobClient.getBalance();
      setWalletBalance("bob", Math.floor(bobBalance.balance / 1000));
      addBalanceSnapshot({ walletId: "bob", balance: Math.floor(bobBalance.balance / 1000) });

      updateTransaction(payTxId, {
        status: "success",
        description: `fetch402 paid ${price} sats. Preimage: ${payResult.preimage}`,
      });

      updateFlowStep(payFlowId, {
        label: `✅ Paid: ${price} sats`,
        status: "success",
        snippetIds: ["fetch-with-l402"],
      });

      // Step 4: Retry with proof
      setState("verified");

      addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: `🔑 Retry with preimage proof`,
        direction: "right",
        status: "success",
        snippetIds: ["fetch-with-l402"],
      });

      // Step 5: Server returns data
      await new Promise((r) => setTimeout(r, 600));

      const mockData = JSON.stringify(
        [
          { id: "prod-1", name: "Nostr T-Shirt", price: 5000, currency: "sats" },
          { id: "prod-2", name: "Lightning Guide eBook", price: 2000, currency: "sats" },
          { id: "prod-3", name: "Hardware Wallet", price: 15000, currency: "sats" },
        ],
        null,
        2
      );

      setResponseData(mockData);
      setState("delivered");

      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: `📦 Response: 200 OK (${price} sats earned)`,
        direction: "left",
        status: "success",
        snippetIds: [],
      });
    } catch (err) {
      console.error("L402 flow failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setState("idle");

      updateTransaction(txId, {
        status: "error",
        description: `L402 flow failed: ${errorMessage}`,
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>🤖</span>
          <span>AI Agent: fetch402</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "idle" && (
          <>
            <p className="text-sm text-muted-foreground">
              Select an API endpoint to request:
            </p>
            <div className="space-y-2">
              {ENDPOINTS.map((ep) => (
                <button
                  key={ep.path}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-3 border rounded-lg transition-colors ${
                    endpoint === ep.path
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm font-mono">
                      {ep.path}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ⚡ {ep.price} sats
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ep.label}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {state === "idle" && (
          <>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={handleFetch}
              disabled={isRequesting}
              className="w-full"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  fetch402("{endpoint}")
                </>
              )}
            </Button>
          </>
        )}

        {state !== "idle" && state !== "delivered" && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">
                {state === "requested" && "Sending request..."}
                {state === "invoice_received" && "Invoice received, paying..."}
                {state === "paid" && "Payment confirmed, retrying with proof..."}
                {state === "verified" && "Verifying payment..."}
              </span>
            </div>
          </div>
        )}

        {state === "delivered" && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span className="font-medium">Data delivered!</span>
            </div>
            <p className="text-xs mt-1">
              Total spent this session: {totalSpent} sats
            </p>
          </div>
        )}

        {state === "delivered" && (
          <Button
            onClick={() => {
              setState("idle");
              setInvoice(null);
              setPreimage(null);
              setResponseData(null);
              setError(null);
            }}
            variant="outline"
            className="w-full"
          >
            Try Another Endpoint
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ServerPanel() {
  const { state, endpoint, price, invoice, responseData } = useL402Store();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>⚡</span>
          <span>Shopstr API: L402 Server</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "idle" && (
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            <p>Waiting for agent request...</p>
            <div className="mt-2 font-mono text-xs space-y-1">
              <p className="text-muted-foreground">Price list:</p>
              {ENDPOINTS.map((ep) => (
                <p key={ep.path}>
                  {ep.path} → {ep.price} sats
                </p>
              ))}
            </div>
          </div>
        )}

        {state === "requested" && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">Generating invoice...</span>
            </div>
            <p className="text-xs mt-1 font-mono">GET {endpoint}</p>
          </div>
        )}

        {(state === "invoice_received" || state === "paid" || state === "verified") && (
          <>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-purple-800 dark:text-purple-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span className="font-medium">HTTP 402 Payment Required</span>
              </div>
              <p className="text-xs mt-1">
                {endpoint} costs {price} sats
              </p>
            </div>
            {invoice && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Lightning Invoice
                </label>
                <div className="p-2 bg-muted rounded font-mono text-xs break-all">
                  {invoice.slice(0, 60)}...
                </div>
              </div>
            )}
            <div className="p-3 bg-muted rounded-lg text-xs font-mono space-y-1">
              <p className="text-muted-foreground">L402 flow:</p>
              <p>1. Agent requests {endpoint}</p>
              <p>2. Server returns 402 + invoice</p>
              <p>3. fetch402 auto-pays</p>
              <p>4. Retry with preimage header</p>
              <p>5. Server verifies → return data</p>
            </div>
          </>
        )}

        {state === "delivered" && responseData && (
          <div className="space-y-2">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span className="font-medium">HTTP 200 OK</span>
              </div>
              <p className="text-xs mt-1">Payment verified. Data delivered.</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Response</label>
              <pre className="p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                {responseData}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FlowPanel() {
  const { state, endpoint, price, totalSpent, preimage } = useL402Store();

  const steps = [
    {
      label: "Request",
      desc: `GET ${endpoint}`,
      states: ["requested", "invoice_received", "paid", "verified", "delivered"],
    },
    {
      label: "402",
      desc: `Invoice: ${price} sats`,
      states: ["invoice_received", "paid", "verified", "delivered"],
    },
    {
      label: "Pay",
      desc: `fetch402 auto-pays`,
      states: ["paid", "verified", "delivered"],
    },
    {
      label: "Retry",
      desc: `Preimage proof`,
      states: ["verified", "delivered"],
    },
    {
      label: "200 OK",
      desc: "Data delivered",
      states: ["delivered"],
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>📊</span>
          <span>L402 Flow</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {steps.map((step, i) => {
            const active = step.states.includes(state);

            return (
              <div key={step.label} className="flex items-start gap-3">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    active
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {active ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {totalSpent > 0 && (
          <div className="pt-3 border-t">
            <p className="text-sm font-medium">Session Stats</p>
            <p className="text-2xl font-bold">{totalSpent} sats</p>
            <p className="text-xs text-muted-foreground">earned by API</p>
          </div>
        )}

        {preimage && (
          <div className="pt-3 border-t">
            <label className="text-xs text-muted-foreground">
              Proof of Payment
            </label>
            <div className="p-2 bg-muted rounded font-mono text-xs break-all mt-1">
              {preimage}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
