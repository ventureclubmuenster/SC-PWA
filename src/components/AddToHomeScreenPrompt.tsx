"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    AddToHomeScreen: (config: Record<string, unknown>) => {
      show: (locale?: string) => void;
      clearModalDisplayCount: () => void;
    };
    AddToHomeScreenInstance: ReturnType<Window["AddToHomeScreen"]> | null;
  }
}

function isRunningAsPWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

export default function AddToHomeScreenPrompt() {
  useEffect(() => {
    if (isRunningAsPWA()) return;
    if (typeof window.AddToHomeScreen !== "function") return;

    window.AddToHomeScreenInstance = window.AddToHomeScreen({
      appName: "Startup Contacts",
      appNameDisplay: "inline",
      appIconUrl: "/apple-touch-icon.png",
      assetUrl:
        "https://cdn.jsdelivr.net/gh/philfung/add-to-homescreen@3.5/dist/assets/img/",
      maxModalDisplayCount: -1,
      displayOptions: { showMobile: true, showDesktop: true },
      allowClose: true,
      showArrow: true,
    });

    window.AddToHomeScreenInstance.show("de");
  }, []);

  if (typeof window !== "undefined" && isRunningAsPWA()) {
    return null;
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/philfung/add-to-homescreen@3.5/dist/add-to-homescreen.min.css"
      />
      <Script
        src="https://cdn.jsdelivr.net/gh/philfung/add-to-homescreen@3.5/dist/add-to-homescreen.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (isRunningAsPWA()) return;
          if (typeof window.AddToHomeScreen !== "function") return;

          window.AddToHomeScreenInstance = window.AddToHomeScreen({
            appName: "Startup Contacts",
            appNameDisplay: "inline",
            appIconUrl: "/apple-touch-icon.png",
            assetUrl:
              "https://cdn.jsdelivr.net/gh/philfung/add-to-homescreen@3.5/dist/assets/img/",
            maxModalDisplayCount: -1,
            displayOptions: { showMobile: true, showDesktop: true },
            allowClose: true,
            showArrow: true,
          });

          window.AddToHomeScreenInstance.show("de");
        }}
      />
    </>
  );
}
