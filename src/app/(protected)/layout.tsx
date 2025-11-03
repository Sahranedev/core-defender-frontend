import { redirect } from "next/navigation";
import { verifySession } from "../lib/session";
import Header from "@/components/Header";

export default async function layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <Header />
      <main className="w-full h-screen">{children}</main>
    </>
  );
}
