import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doctors Page",
  description: "View all your doctors",
};

export default async function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
 return <>{children}</>
}
