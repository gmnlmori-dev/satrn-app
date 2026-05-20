import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Accesso",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return <LoginForm inactive={reason === "inactive"} />;
}
