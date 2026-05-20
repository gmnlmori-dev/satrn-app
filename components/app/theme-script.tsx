import Script from "next/script";
import { themeInitScript } from "@/lib/theme";

export function ThemeScript() {
  return (
    <Script
      id="satrn-theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
    />
  );
}
