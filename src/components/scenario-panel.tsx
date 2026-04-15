import { useScenarioStore } from "@/stores";
import {
  MarketplaceCheckoutScenario,
  PlatformFeeScenario,
  SellerPayoutScenario,
  BuyerEscrowScenario,
  ZapvertisingScenario,
  L402ApiScenario,
} from "./scenarios";
import {
  BitcoinConnectButtonScenario,
  ConnectWalletScenario,
  PayButtonScenario,
  PaymentModalScenario,
} from "./bitcoin-connect";

export function ScenarioPanel() {
  const { currentScenario } = useScenarioStore();

  switch (currentScenario.id) {
    case "marketplace-checkout":
      return <MarketplaceCheckoutScenario />;
    case "platform-fee":
      return <PlatformFeeScenario />;
    case "seller-payout":
      return <SellerPayoutScenario />;
    case "buyer-escrow":
      return <BuyerEscrowScenario />;
    case "zapvertising":
      return <ZapvertisingScenario />;
    case "l402-api-payments":
      return <L402ApiScenario />;
    case "bitcoin-connect-button":
      return <BitcoinConnectButtonScenario />;
    case "connect-wallet":
      return <ConnectWalletScenario />;
    case "pay-button":
      return <PayButtonScenario />;
    case "payment-modal":
      return <PaymentModalScenario />;
    default:
      return null;
  }
}
