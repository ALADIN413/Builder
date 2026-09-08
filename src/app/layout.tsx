import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";
import { SESSION_COOKIE } from "@/lib/session";
import { getCurrentUser } from "@/lib/auth";
import { getTeamDirectory } from "@/lib/queries";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Founder OS",
    template: "%s · Founder OS",
  },
  description:
    "Team execution and capability-tracking system. Inputs are not achievements. Output is.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();
  const hasSession = Boolean(store.get(SESSION_COOKIE)?.value);

  let session:
    | {
        user: { id: string; name: string; emoji: string; isHead: boolean };
        members: Awaited<ReturnType<typeof getTeamDirectory>>["members"];
        meeting: Awaited<ReturnType<typeof getTeamDirectory>>["meeting"];
      }
    | null = null;

  if (hasSession) {
    const user = await getCurrentUser();
    if (user) {
      const { members, meeting } = await getTeamDirectory(user);
      session = {
        user: {
          id: user.id,
          name: user.name,
          emoji: user.emoji,
          isHead: user.isHead,
        },
        members,
        meeting,
      };
    }
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {session ? (
          <AppShell session={session}>{children}</AppShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}