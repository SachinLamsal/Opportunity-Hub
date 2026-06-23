import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Log in",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const authError =
    params.error === "auth_callback_failed"
      ? "Sign-in link expired or failed. Please log in again."
      : undefined;

  return <LoginForm authError={authError} />;
}
