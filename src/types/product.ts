import type { BillingPeriod } from "@prisma/client";

export interface ProductPlan {
  id?: string;
  name: string;
  planType: string;
  price: number;
  originalPrice?: number;
  billingPeriod: BillingPeriod | string;
  duration: number;
  features: string[] | string;
  isPopular: boolean;
  isAvailable: boolean;
  maxSubscriptions?: number;
  deliveryType?: "MANUAL" | "AUTOMATIC";
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category:
    | {
        id: string;
        name: string;
        slug: string;
      }
    | string;
  logoUrl?: string | null;
  borderColor?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  displayOrder?: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  plans: ProductPlan[];
}

export interface Category {
  key: string;
  label: string;
  count: number;
  color?: string;
  icon?: string;
  description?: string;
}

export interface ExtendedCategory extends Category {
  color: string;
  icon: string;
  description: string;
}
