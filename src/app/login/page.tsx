import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LoginScreen } from "@/components/auth/login-screen";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const profiles = await prisma.user.findMany({
    orderBy: [{ isHead: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      emoji: true,
      isHead: true,
      team: { select: { name: true } },
    },
  });

  return <LoginScreen profiles={profiles} />;
}