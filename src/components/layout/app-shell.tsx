import { AppShellContent } from "./app-shell-content";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <AppShellContent>{children}</AppShellContent>;
}