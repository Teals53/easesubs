import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage() {
  // Authentication is handled by middleware
  return <CheckoutForm />;
}
