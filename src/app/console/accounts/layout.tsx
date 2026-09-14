export default function AccountsLayout({
  children,
  detail,
}: Readonly<{ children: React.ReactNode; detail: React.ReactNode }>) {
  return (
    <>
      {children}
      {detail}
    </>
  );
}
