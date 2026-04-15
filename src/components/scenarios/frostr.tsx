import { useState, useEffect } from "react";
import {
  Loader2,
  Key,
  Shield,
  Check,
  XCircle,
  Fingerprint,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore, useTransactionStore, useFrostrStore } from "@/stores";

const ADMIN_PERSONA = { name: "Admin", emoji: "👤" };
const MEMBER_A_PERSONA = { name: "Member A", emoji: "🔑" };
const MEMBER_B_PERSONA = { name: "Member B", emoji: "🔑" };

function generateGroupId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateSignature(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(64));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function FrostrScenario() {
  const { areAllWalletsConnected } = useWalletStore();
  const { reset } = useFrostrStore();
  const allConnected = areAllWalletsConnected(["alice", "bob", "charlie"]);

  useEffect(() => {
    reset();
  }, [reset]);

  if (!allConnected) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <AdminPanel />
      <MemberAPanel />
      <MemberBPanel />
    </div>
  );
}

function AdminPanel() {
  const [isCreating, setIsCreating] = useState(false);
  const [combinedSig, setCombinedSig] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const { } = useWalletStore();
  const { addTransaction, updateTransaction, addFlowStep } =
    useTransactionStore();
  const {
    state,
    keyset,
    shares,
    signRequest,
    setState,
    setKeyset,
    setShares,
    setSignRequest,
    updateShare,
    incrementPartialSigs,
  } = useFrostrStore();

  const createKeyset = async () => {
    setIsCreating(true);

    const txId = addTransaction({
      type: "invoice_created",
      status: "pending",
      description: "Generating FROSTR 2-of-3 keyset...",
      snippetIds: ["make-invoice"],
    });

    try {
      // Simulate keyset generation
      await new Promise((r) => setTimeout(r, 800));

      const groupId = generateGroupId();
      const newKeyset = { threshold: 2, total: 3, groupId };

      setKeyset(newKeyset);
      setState("keyset_created");

      updateTransaction(txId, {
        status: "success",
        description: `FROSTR keyset created: 2-of-3 (group: ${groupId.substring(0, 8)}...)`,
      });

      addFlowStep({
        fromWallet: "alice",
        toWallet: "alice",
        label: `🔐 Keyset created: 2-of-3`,
        direction: "left",
        status: "success",
        snippetIds: ["make-invoice"],
      });

      // Auto-distribute shares
      await new Promise((r) => setTimeout(r, 500));

      const newShares = [
        { id: "share-0", holder: "Admin", status: "active" as const },
        { id: "share-1", holder: "Member A", status: "active" as const },
        { id: "share-2", holder: "Member B", status: "active" as const },
      ];

      setShares(newShares);
      setState("shares_distributed");

      addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: "📤 Share 1 → Member A",
        direction: "right",
        status: "success",
      });

      addFlowStep({
        fromWallet: "alice",
        toWallet: "charlie",
        label: "📤 Share 2 → Member B",
        direction: "right",
        status: "success",
      });
    } catch (err) {
      updateTransaction(txId, {
        status: "error",
        description: `Failed to create keyset: ${err}`,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const initiateSignRequest = () => {
    const newSignRequest = {
      message: "Sign this Nostr event (kind 0: profile update)",
      partialSigs: 0,
      required: 2,
    };
    setSignRequest(newSignRequest);
    setState("signing");
    setCombinedSig(null);

    addFlowStep({
      fromWallet: "alice",
      toWallet: "bob",
      label: "📝 Sign request: Nostr event",
      direction: "right",
      status: "pending",
    });
  };

  const adminSign = async () => {
    if (!signRequest) return;

    incrementPartialSigs();

    addTransaction({
      type: "payment_sent",
      status: "success",
      amount: 0,
      description: "Admin contributed partial signature (share 0)",
    });

    addFlowStep({
      fromWallet: "alice",
      toWallet: "alice",
      label: "✍️ Partial sig 1/2 from Admin",
      direction: "left",
      status: "success",
    });

    // Check if threshold met
    const currentSigs = useFrostrStore.getState().signRequest?.partialSigs || 0;
    if (currentSigs >= 2) {
      await finalizeSignature();
    }
  };

  const finalizeSignature = async () => {
    setIsSigning(true);
    await new Promise((r) => setTimeout(r, 600));

    const sig = generateSignature();
    setCombinedSig(sig);
    setState("signed");

    addFlowStep({
      fromWallet: "alice",
      toWallet: "alice",
      label: "✅ Combined signature produced (BIP-340)",
      direction: "left",
      status: "success",
    });

    addTransaction({
      type: "payment_sent",
      status: "success",
      amount: 0,
      description: "Combined FROSTR signature: threshold 2/3 met, event signed",
    });

    setIsSigning(false);
  };

  const revokeMemberB = () => {
    updateShare("share-2", "revoked");
    setState("share_revoked");

    addFlowStep({
      fromWallet: "alice",
      toWallet: "charlie",
      label: "🚫 Revoked Member B's share",
      direction: "right",
      status: "error",
    });

    addTransaction({
      type: "payment_failed",
      status: "success",
      amount: 0,
      description: "Member B's share revoked. Active: Admin + Member A (2/2 remaining)",
    });
  };

  const newSignAfterRevocation = () => {
    const newSignRequest = {
      message: "Sign event after revocation",
      partialSigs: 0,
      required: 2,
    };
    setSignRequest(newSignRequest);
    setCombinedSig(null);
    setState("signing");

    addFlowStep({
      fromWallet: "alice",
      toWallet: "bob",
      label: "📝 New sign request (post-revocation)",
      direction: "right",
      status: "pending",
    });

    // Admin signs immediately
    setTimeout(() => {
      useFrostrStore.getState().incrementPartialSigs();
      addTransaction({
        type: "payment_sent",
        status: "success",
        amount: 0,
        description: "Admin partial signature contributed",
      });

      addFlowStep({
        fromWallet: "alice",
        toWallet: "alice",
        label: "✍️ Partial sig from Admin",
        direction: "left",
        status: "success",
      });
    }, 300);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{ADMIN_PERSONA.emoji}</span>
          <span>Admin: Key Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "idle" && (
          <>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              <p>
                Create a 2-of-3 FROSTR keyset. The npub becomes the shop
                identity — any 2 of 3 shares can sign.
              </p>
            </div>
            <Button
              onClick={createKeyset}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Keyset...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Create 2-of-3 Keyset
                </>
              )}
            </Button>
          </>
        )}

        {state === "shares_distributed" && keyset && (
          <>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
              <p className="font-medium">Keyset Active</p>
              <p className="text-xs mt-1">
                {keyset.threshold}-of-{keyset.total} threshold
              </p>
              <p className="text-xs font-mono mt-1">
                group: {keyset.groupId.substring(0, 12)}...
              </p>
            </div>
            <div className="space-y-1">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-2 border rounded text-sm"
                >
                  <span>
                    {share.holder}
                    {share.id === "share-0" && " (Admin)"}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      share.status === "active"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {share.status}
                  </span>
                </div>
              ))}
            </div>
            <Button onClick={initiateSignRequest} className="w-full">
              <Shield className="mr-2 h-4 w-4" />
              Initiate Sign Request
            </Button>
          </>
        )}

        {state === "signing" && signRequest && (
          <>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Signing in Progress</p>
              <p className="text-xs mt-1">{signRequest.message}</p>
              <p className="text-xs mt-1 font-mono">
                Partial sigs: {signRequest.partialSigs}/{signRequest.required}
              </p>
            </div>
            {signRequest.partialSigs < 1 && (
              <Button onClick={adminSign} className="w-full">
                <Fingerprint className="mr-2 h-4 w-4" />
                Admin: Provide Partial Signature
              </Button>
            )}
            {signRequest.partialSigs >= 1 && signRequest.partialSigs < 2 && (
              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for another share holder...
              </div>
            )}
            {isSigning && (
              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Combining partial signatures...
              </div>
            )}
          </>
        )}

        {state === "signed" && combinedSig && (
          <>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span className="font-medium">Event Signed!</span>
              </div>
              <p className="text-xs mt-1">
                Combined signature (BIP-340 Schnorr):
              </p>
              <p className="text-xs font-mono mt-1 break-all">
                {combinedSig.substring(0, 32)}...
              </p>
              <p className="text-xs mt-1 text-green-600 dark:text-green-400">
                Indistinguishable from a single-sig signature.
              </p>
            </div>
            <Button onClick={revokeMemberB} variant="destructive" className="w-full">
              <XCircle className="mr-2 h-4 w-4" />
              Revoke Member B's Share
            </Button>
          </>
        )}

        {state === "share_revoked" && (
          <>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm text-orange-800 dark:text-orange-200">
              <p className="font-medium">Member B Revoked</p>
              <p className="text-xs mt-1">
                Active shares: Admin + Member A (2/2 remaining)
              </p>
            </div>
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between p-2 border rounded text-sm"
              >
                <span>
                  {share.holder}
                  {share.id === "share-0" && " (Admin)"}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    share.status === "active"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  }`}
                >
                  {share.status}
                </span>
              </div>
            ))}
            <Button onClick={newSignAfterRevocation} className="w-full">
              <Shield className="mr-2 h-4 w-4" />
              Sign After Revocation
            </Button>
          </>
        )}

        {state === "recovered" && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span className="font-medium">Signed with remaining shares!</span>
            </div>
            <p className="text-xs mt-1">
              2-of-2 threshold met with Admin + Member A.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MemberAPanel() {
  const [hasSigned, setHasSigned] = useState(false);
  const [hasSignedRecovery, setHasSignedRecovery] = useState(false);

  const { state, shares, signRequest, incrementPartialSigs } =
    useFrostrStore();
  const { addTransaction, addFlowStep } = useTransactionStore();

  const memberASign = () => {
    if (!signRequest) return;

    incrementPartialSigs();
    setHasSigned(true);

    addTransaction({
      type: "payment_sent",
      status: "success",
      amount: 0,
      description: "Member A contributed partial signature (share 1)",
    });

    addFlowStep({
      fromWallet: "bob",
      toWallet: "bob",
      label: "✍️ Partial sig 2/2 from Member A",
      direction: "left",
      status: "success",
    });

    // Check threshold
    const currentSigs = useFrostrStore.getState().signRequest?.partialSigs || 0;
    if (currentSigs >= 2) {
      setTimeout(() => {
        useFrostrStore.setState({ state: "signed" });
        addFlowStep({
          fromWallet: "bob",
          toWallet: "bob",
          label: "✅ Combined signature produced (BIP-340)",
          direction: "left",
          status: "success",
        });
      }, 600);
    }
  };

  const memberASignRecovery = () => {
    if (!signRequest) return;

    incrementPartialSigs();
    setHasSignedRecovery(true);

    addTransaction({
      type: "payment_sent",
      status: "success",
      amount: 0,
      description: "Member A contributed partial signature for recovery",
    });

    addFlowStep({
      fromWallet: "bob",
      toWallet: "bob",
      label: "✍️ Partial sig 2/2 from Member A",
      direction: "left",
      status: "success",
    });

    // Threshold met with Admin + Member A
    setTimeout(() => {
      useFrostrStore.setState({ state: "recovered" });
      addFlowStep({
        fromWallet: "bob",
        toWallet: "bob",
        label: "✅ Signature recovered (Admin + A)",
        direction: "left",
        status: "success",
      });
    }, 600);
  };

  const memberAShare = shares.find((s) => s.id === "share-1");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{MEMBER_A_PERSONA.emoji}</span>
          <span>Member A: Share Holder</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "idle" && (
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            <p>Waiting for Admin to create the keyset...</p>
          </div>
        )}

        {state === "keyset_created" && (
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            <p>Keyset created. Waiting for share distribution...</p>
          </div>
        )}

        {state === "shares_distributed" && memberAShare && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span className="font-medium">Share 1 Received</span>
            </div>
            <p className="text-xs mt-1">
              You hold one of 3 shares in the 2-of-3 keyset.
            </p>
            <p className="text-xs mt-1">
              Status:{" "}
              <span className="font-mono">{memberAShare.status}</span>
            </p>
          </div>
        )}

        {state === "signing" && signRequest && (
          <>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Sign Request Received</p>
              <p className="text-xs mt-1">{signRequest.message}</p>
              <p className="text-xs mt-1 font-mono">
                Partial sigs: {signRequest.partialSigs}/{signRequest.required}
              </p>
            </div>
            {!hasSigned && signRequest.partialSigs < 2 && (
              <Button onClick={memberASign} className="w-full">
                <Fingerprint className="mr-2 h-4 w-4" />
                Provide Partial Signature
              </Button>
            )}
            {hasSigned && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Partial signature contributed</span>
                </div>
              </div>
            )}
          </>
        )}

        {(state === "signed" || state === "share_revoked") && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
            {state === "signed" ? (
              <>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">Event Signed</span>
                </div>
                <p className="text-xs mt-1">
                  Your partial sig was combined with another share holder's to
                  produce a valid BIP-340 signature.
                </p>
              </>
            ) : (
              <p>Share active. Waiting for new sign request...</p>
            )}
          </div>
        )}

        {state === "signing" &&
          signRequest &&
          !hasSignedRecovery &&
          signRequest.partialSigs >= 1 && (
            <Button onClick={memberASignRecovery} className="w-full">
              <Fingerprint className="mr-2 h-4 w-4" />
              Provide Partial Signature
            </Button>
          )}

        {state === "recovered" && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span className="font-medium">Signed after revocation!</span>
            </div>
            <p className="text-xs mt-1">
              Admin + Member A produced a valid signature without Member B.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MemberBPanel() {
  const [hasSigned, setHasSigned] = useState(false);

  const { state, shares, signRequest, incrementPartialSigs } =
    useFrostrStore();
  const { addTransaction, addFlowStep } = useTransactionStore();

  const memberBSign = () => {
    if (!signRequest) return;

    incrementPartialSigs();
    setHasSigned(true);

    addTransaction({
      type: "payment_sent",
      status: "success",
      amount: 0,
      description: "Member B contributed partial signature (share 2)",
    });

    addFlowStep({
      fromWallet: "charlie",
      toWallet: "charlie",
      label: "✍️ Partial sig from Member B",
      direction: "left",
      status: "success",
    });

    // Check threshold
    const currentSigs = useFrostrStore.getState().signRequest?.partialSigs || 0;
    if (currentSigs >= 2) {
      setTimeout(() => {
        useFrostrStore.setState({ state: "signed" });
        addFlowStep({
          fromWallet: "charlie",
          toWallet: "charlie",
          label: "✅ Combined signature produced (BIP-340)",
          direction: "left",
          status: "success",
        });
      }, 600);
    }
  };

  const memberBShare = shares.find((s) => s.id === "share-2");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{MEMBER_B_PERSONA.emoji}</span>
          <span>Member B: Share Holder</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "idle" && (
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            <p>Waiting for Admin to create the keyset...</p>
          </div>
        )}

        {state === "keyset_created" && (
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            <p>Keyset created. Waiting for share distribution...</p>
          </div>
        )}

        {state === "shares_distributed" && memberBShare && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span className="font-medium">Share 2 Received</span>
            </div>
            <p className="text-xs mt-1">
              You hold one of 3 shares in the 2-of-3 keyset.
            </p>
            <p className="text-xs mt-1">
              Status:{" "}
              <span className="font-mono">{memberBShare.status}</span>
            </p>
          </div>
        )}

        {state === "signing" &&
          memberBShare?.status === "active" &&
          signRequest && (
            <>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Sign Request Received</p>
                <p className="text-xs mt-1">{signRequest.message}</p>
                <p className="text-xs mt-1 font-mono">
                  Partial sigs: {signRequest.partialSigs}/{signRequest.required}
                </p>
              </div>
              {!hasSigned && signRequest.partialSigs < 2 && (
                <Button onClick={memberBSign} className="w-full">
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Provide Partial Signature
                </Button>
              )}
              {hasSigned && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Partial signature contributed</span>
                  </div>
                </div>
              )}
            </>
          )}

        {(state === "signed" && memberBShare?.status === "active") && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span className="font-medium">Event Signed</span>
            </div>
            <p className="text-xs mt-1">
              Your partial sig was combined with another to produce a valid
              BIP-340 signature.
            </p>
          </div>
        )}

        {(state === "share_revoked" || state === "recovered") && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-800 dark:text-red-200">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">Share Revoked</span>
            </div>
            <p className="text-xs mt-1">
              Your share has been revoked by the Admin. You can no longer
              participate in signing.
            </p>
            <p className="text-xs mt-1">
              The remaining 2 shares (Admin + Member A) can still sign events.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
