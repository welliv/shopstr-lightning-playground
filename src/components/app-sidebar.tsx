import {
  CodeIcon,
  DropletsIcon,
  ExternalLink,
  LightbulbIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { scenarios } from "@/data/scenarios";
import { BitcoinConnectIcon } from "@/icons/BitcoinConnectIcon";

const externalLinks = [
  {
    title: "NWC Faucet",
    url: "https://faucet.nwc.dev",
    icon: <DropletsIcon className="size-4" />,
  },
  {
    title: "Source Code",
    url: "https://github.com/shopstr-eng/shopstr",
    icon: <CodeIcon className="size-4" />,
  },
  {
    title: "Feedback",
    url: "https://github.com/shopstr-eng/shopstr/issues",
    icon: <LightbulbIcon className="size-4" />,
  },
];

export function AppSidebar() {
  const location = useLocation();
  // Extract scenarioId from pathname (e.g., "/simple-payment" or "/#/simple-payment")
  const scenarioId = location.pathname.split("/").filter(Boolean)[0];

  const regularScenarios = scenarios.filter(
    (s) => !s.section || s.section === "scenarios",
  );
  const bitcoinConnectScenarios = scenarios.filter(
    (s) => s.section === "bitcoin-connect",
  );

  return (
    <Sidebar>
      <SidebarHeader className="">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <div>
            <h1 className="font-semibold">Shopstr Lightning Playground</h1>
            <p className="text-xs text-muted-foreground">
              Lightning Payments for Marketplaces
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={!scenarioId}>
                  <Link to="/">
                    <span>👋</span>
                    <span>Getting Started</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {regularScenarios.map((scenario) => (
                <SidebarMenuItem key={scenario.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={scenarioId === scenario.id}
                  >
                    <Link to={`/${scenario.id}`}>
                      <span>{scenario.icon}</span>
                      <span>{scenario.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Bitcoin Connect Section */}
        <SidebarGroup className="-mt-4">
          <SidebarGroupLabel className="-mb-1">
            <div title="Bitcoin Connect: let bitcoin surf the web">
              <BitcoinConnectIcon className="size-20" />
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {bitcoinConnectScenarios.map((scenario) => (
                <SidebarMenuItem key={scenario.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={scenarioId === scenario.id}
                  >
                    <Link to={`/${scenario.id}`}>
                      <span>{scenario.icon}</span>
                      <span>{scenario.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-0" />

      <SidebarFooter>
        <SidebarMenu>
          {externalLinks.map((link) => (
            <SidebarMenuItem key={link.url}>
              <SidebarMenuButton asChild>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <span>{link.icon}</span>
                  <span>{link.title}</span>
                  <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
