import { AppShellContent, type ShellSession } from "./app-shell-content";

export function AppShell({
  session,
  children,
}: {
  session: ShellSession;
  children: React.ReactNode;
}) {
  return <AppShellContent session={session}>{children}</AppShellContent>;
}