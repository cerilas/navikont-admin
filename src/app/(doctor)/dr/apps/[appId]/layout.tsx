import DoctorSidebar from "@/components/layout/DoctorSidebar";

export default async function DoctorAppLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ appId: string }>;
}>) {
  const { appId } = await params;

  return (
    <>
      <DoctorSidebar appId={appId} />
      {children}
    </>
  );
}
