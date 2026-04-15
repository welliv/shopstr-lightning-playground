import {
  CodeIcon,
  DropletsIcon,
  ExternalLink,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { scenarios } from "@/data/scenarios";

const externalLinks = [
  {
    title: "Connect Test Wallet",
    url: "https://faucet.nwc.dev",
    icon: <DropletsIcon className="size-4" />,
  },
  {
    title: "Source Code",
    url: "https://github.com/shopstr-eng/shopstr",
    icon: <CodeIcon className="size-4" />,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const scenarioId = location.pathname.split("/").filter(Boolean)[0];

  // Group scenarios by section
  const coreScenarios = scenarios.filter(
    (s) => !s.section || s.section === "scenarios",
  );
  const infraScenarios = scenarios.filter(
    (s) => s.section === "infrastructure",
  );

  return (
    <Sidebar>
      <SidebarHeader className="">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <div>
            <h1 className="font-semibold">Shopstr Sandbox</h1>
            <p className="text-xs text-muted-foreground">
              Explore Nostr Commerce Scenarios
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent>
        {/* Getting Started */}
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        {/* Core Scenarios */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreScenarios.map((scenario) => (
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

        {/* Infrastructure Section */}
        {infraScenarios.length > 0 && (
          <>
            <SidebarSeparator className="mx-0" />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {infraScenarios.map((scenario) => (
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
          </>
        )}
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
