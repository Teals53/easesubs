import { SignInForm } from "./signin-form";

export default async function SignInPage() {
  // Authenticated user redirects are handled by middleware
  return <SignInForm />;
}
