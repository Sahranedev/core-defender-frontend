import VerifyEmail from "./VerifyEmail";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  console.log(token);

  return <VerifyEmail token={token ?? null} />;
}
