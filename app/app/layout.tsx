import { AppChrome } from "@/components/app/app-chrome";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppChrome>{children}</AppChrome>;
}
