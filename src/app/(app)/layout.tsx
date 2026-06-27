import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DiGA Base - Admin Paneli",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
