import { SignUpForm } from "./signup-form";

export default async function SignUpPage() {
  // Authenticated user redirects are handled by middleware
  return <SignUpForm />;
}
