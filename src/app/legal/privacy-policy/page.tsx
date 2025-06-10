import { Metadata } from "next";
import PrivacyPolicyClient from "./privacy-policy-client";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how EaseSubs collects, uses, and protects your personal information. Our comprehensive privacy policy explains our data practices and your rights.",
  keywords: [
    "privacy policy",
    "data protection",
    "personal information",
    "GDPR compliance",
    "data security",
    "user privacy",
    "subscription privacy",
  ],
  alternates: {
    canonical: "/legal/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy - EaseSubs",
    description: "Learn how EaseSubs collects, uses, and protects your personal information.",
    url: "https://easesubs.com/legal/privacy-policy",
    type: "article",
    publishedTime: new Date().toISOString(),
    modifiedTime: new Date().toISOString(),
    section: "Legal",
    tags: ["Privacy", "Legal", "Data Protection"],
  },
  twitter: {
    title: "Privacy Policy - EaseSubs",
    description: "Learn how EaseSubs collects, uses, and protects your personal information.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}

