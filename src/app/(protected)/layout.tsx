import { redirect } from "next/navigation";
import { verifySession } from "../lib/session";
import Header from "@/components/Header";

export default async function layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const session = await verifySession();

  /*  if (!session) {
    redirect("/login");
  } */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="w-full">{children}</main>
    </div>
  );
}
