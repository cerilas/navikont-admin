import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DiGA Base - Doktor Paneli",
};

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
