"use client";

import { useEffect, useState, useCallback } from "react";
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

function isFirefoxIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /FxiOS/i.test(ua);
}

const ADHS_CONFIG = {
  appName: "Startup Contacts",
  appNameDisplay: "inline",
  appIconUrl: "/apple-touch-icon.png",
  assetUrl:
    "https://cdn.jsdelivr.net/gh/philfung/add-to-homescreen@3.5/dist/assets/img/",
  maxModalDisplayCount: -1,
  displayOptions: { showMobile: true, showDesktop: true },
  allowClose: true,
  showArrow: true,
};

function initLibrary() {
  if (isRunningAsPWA() || isFirefoxIOS()) return;
  if (typeof window.AddToHomeScreen !== "function") return;

  window.AddToHomeScreenInstance = window.AddToHomeScreen(ADHS_CONFIG);
  window.AddToHomeScreenInstance.show("de");
}

function FirefoxIOSPrompt() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select a hidden input
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <div
      className="adhs-container adhs-mobile"
      style={{
        display: "block",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: visible ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0)",
        zIndex: 999999,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease-in-out, background-color 0.3s ease-in-out",
        fontFamily: '"Roboto", sans-serif',
        color: "#212121",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
      }}
      onClick={() => setVisible(false)}
    >
      <div
        style={{
          backgroundColor: "#f5f5f5",
          borderRadius: 7,
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          left: "50%",
          maxWidth: 400,
          padding: "49px 19px 32px 19px",
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          lineHeight: "normal",
          top: "40%",
          transform: "translateY(-50%) translateX(-50%)",
          width: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* App icon */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            margin: "auto",
            height: 80,
            width: 80,
            top: -45,
            zIndex: 1000000,
          }}
        >
          <img
            src="/apple-touch-icon.png"
            alt="App Icon"
            style={{ width: 80, height: 80, borderRadius: 12 }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 27,
            fontWeight: 700,
            padding: "0 0 18px 0",
          }}
        >
          App installieren
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Step 1 */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "start",
              margin: "0 0 10px 0",
            }}
          >
            <div style={{ margin: "5px 5px 0 0" }}>
              <div
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: 100,
                  backgroundColor: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    color: "#fff",
                    fontSize: 17,
                    fontWeight: 100,
                  }}
                >
                  1
                </span>
              </div>
            </div>
            <div style={{ fontSize: 19, lineHeight: "27px", padding: "5px 5px 0 5px" }}>
              Kopiere den Link dieser Seite:
              <br />
              <button
                onClick={copyLink}
                style={{
                  display: "inline-block",
                  borderRadius: 4,
                  boxShadow: "1px 1px 2px gray",
                  margin: "8px 0",
                  padding: "6px 14px",
                  whiteSpace: "nowrap",
                  backgroundColor: copied ? "#4CAF50" : "#fff",
                  color: copied ? "#fff" : "#212121",
                  border: "none",
                  fontSize: 16,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {copied ? "✓ Kopiert!" : "📋 Link kopieren"}
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "start",
              margin: "0 0 10px 0",
            }}
          >
            <div style={{ margin: "5px 5px 0 0" }}>
              <div
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: 100,
                  backgroundColor: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#fff", fontSize: 17, fontWeight: 100 }}>
                  2
                </span>
              </div>
            </div>
            <div style={{ fontSize: 19, lineHeight: "27px", padding: "5px 5px 0 5px" }}>
              Öffne{" "}
              <span
                style={{
                  display: "inline-block",
                  borderRadius: 4,
                  boxShadow: "1px 1px 2px gray",
                  padding: "2px 8px",
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/philfung/add-to-homescreen@3.5/dist/assets/img/safari-icon.svg"
                  alt="Safari"
                  style={{
                    display: "inline",
                    position: "relative",
                    margin: "0 5px 0 0",
                    top: 2,
                    width: 20,
                    height: 20,
                  }}
                />
                Safari
              </span>{" "}
              und füge den Link ein.
            </div>
          </div>

          {/* Step 3 */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "start",
              margin: "0 0 10px 0",
            }}
          >
            <div style={{ margin: "5px 5px 0 0" }}>
              <div
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: 100,
                  backgroundColor: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#fff", fontSize: 17, fontWeight: 100 }}>
                  3
                </span>
              </div>
            </div>
            <div style={{ fontSize: 19, lineHeight: "27px", padding: "5px 5px 0 5px" }}>
              Tippe auf{" "}
              <span
                style={{
                  display: "inline-block",
                  borderRadius: 4,
                  boxShadow: "1px 1px 2px gray",
                  padding: "2px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/philfung/add-to-homescreen@3.5/dist/assets/img/ios-share-icon.svg"
                  alt="Teilen"
                  style={{
                    display: "inline",
                    position: "relative",
                    top: 2,
                    width: 20,
                    height: 20,
                  }}
                />
              </span>{" "}
              und dann{" "}
              <span style={{ fontWeight: 700, fontSize: 20 }}>
                &quot;Zum Home-Bildschirm&quot;
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddToHomeScreenPrompt() {
  const [showFirefoxPrompt, setShowFirefoxPrompt] = useState(false);

  useEffect(() => {
    if (isRunningAsPWA()) return;
    if (isFirefoxIOS()) {
      setShowFirefoxPrompt(true);
      return;
    }
    initLibrary();
  }, []);

  if (typeof window !== "undefined" && isRunningAsPWA()) {
    return null;
  }

  if (showFirefoxPrompt) {
    return <FirefoxIOSPrompt />;
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
        onLoad={initLibrary}
      />
    </>
  );
}
