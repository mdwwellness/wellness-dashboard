import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appontiment Booking",
  description: "Book your appointement",
};

export default async function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
