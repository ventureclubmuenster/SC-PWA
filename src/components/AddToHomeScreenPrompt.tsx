"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform =
  | "ios-safari"
  | "ios-safari-26"
  | "ios-chrome"
  | "ios-firefox"
  | "ios-edge"
  | "android-chrome"
  | "android-firefox"
  | "android-samsung"
  | "desktop-chrome"
  | "desktop-edge";

// ─── Detection ───────────────────────────────────────────────────────────────

function getIOSMajorVersion(ua: string): number {
  const match = /CPU (?:iPhone )?OS (\d+)_/.exec(ua);
  return match ? parseInt(match[1], 10) : 0;
}

function detectPlatform(): Platform | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  if (isIOS) {
    if (/CriOS/.test(ua)) return "ios-chrome";
    if (/FxiOS/.test(ua)) return "ios-firefox";
    if (/EdgiOS/.test(ua)) return "ios-edge";
    if (/Safari/.test(ua)) {
      return getIOSMajorVersion(ua) >= 26 ? "ios-safari-26" : "ios-safari";
    }
    return null;
  }

  if (isAndroid) {
    if (/SamsungBrowser/.test(ua)) return "android-samsung";
    if (/Firefox/.test(ua)) return "android-firefox";
    if (/Chrome/.test(ua)) return "android-chrome";
    return null;
  }

  // Desktop
  if (/Edg\//.test(ua)) return "desktop-edge";
  if (/Chrome/.test(ua)) return "desktop-chrome";

  return null;
}

function isRunningAsPWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

// ─── Small inline icons ───────────────────────────────────────────────────────

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg align-middle mx-0.5"
      style={{ background: "var(--surface-3)", border: "1px solid var(--border)" }}
    >
      {children}
    </span>
  );
}

function IOSShareIcon() {
  return (
    <IconBadge>
      <svg width="13" height="15" viewBox="0 0 13 15" fill="none">
        <path
          d="M6.5 1v9M6.5 1L3.5 4M6.5 1l3 3"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M1.5 8v5h10V8"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconBadge>
  );
}

function DotsVerticalIcon() {
  return (
    <IconBadge>
      <svg width="4" height="14" viewBox="0 0 4 14" fill="none">
        <circle cx="2" cy="2" r="1.5" fill="var(--foreground)" />
        <circle cx="2" cy="7" r="1.5" fill="var(--foreground)" />
        <circle cx="2" cy="12" r="1.5" fill="var(--foreground)" />
      </svg>
    </IconBadge>
  );
}

function DotsHorizontalIcon() {
  return (
    <IconBadge>
      <svg width="14" height="4" viewBox="0 0 14 4" fill="none">
        <circle cx="2" cy="2" r="1.5" fill="var(--foreground)" />
        <circle cx="7" cy="2" r="1.5" fill="var(--foreground)" />
        <circle cx="12" cy="2" r="1.5" fill="var(--foreground)" />
      </svg>
    </IconBadge>
  );
}

function HamburgerIcon() {
  return (
    <IconBadge>
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
        <path
          d="M1 1h12M1 5h12M1 9h12"
          stroke="var(--foreground)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </IconBadge>
  );
}

// ─── Bouncing arrow pointing at Safari UI button ─────────────────────────────

function BouncingArrow({ platform }: { platform: Platform }) {
  const isIOS26 = platform === "ios-safari-26";

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        bottom: `calc(env(safe-area-inset-bottom) + ${isIOS26 ? "78px" : "56px"})`,
        ...(isIOS26
          ? { right: "22px" }
          : { left: "50%", transform: "translateX(-50%)" }),
        zIndex: 10001,
        animation: "arrowBounce 1.1s ease-in-out infinite",
      }}
    >
      <svg
        width="22"
        height="30"
        viewBox="0 0 22 30"
        fill="none"
        style={{ opacity: 0.85 }}
      >
        <line
          x1="11"
          y1="0"
          x2="11"
          y2="20"
          stroke="#ff8a2a"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M3 13 L11 26 L19 13"
          stroke="#ff8a2a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <style>{`
        @keyframes arrowBounce {
          0%, 100% { transform: ${isIOS26 ? "" : "translateX(-50%) "}translateY(0px); }
          50%       { transform: ${isIOS26 ? "" : "translateX(-50%) "}translateY(7px); }
        }
      `}</style>
    </div>
  );
}

// ─── Step component ───────────────────────────────────────────────────────────

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
        style={{ background: "linear-gradient(135deg, #ff4d42, #ff8a2a)" }}
      >
        {num}
      </div>
      <div className="text-sm leading-6" style={{ color: "var(--foreground)" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Per-platform content ─────────────────────────────────────────────────────

function PlatformContent({
  platform,
  deferredPrompt,
  onInstalled,
}: {
  platform: Platform;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstalled: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") onInstalled();
  }, [deferredPrompt, onInstalled]);

  switch (platform) {
    case "ios-safari":
      return (
        <div className="flex flex-col gap-4">
          <Step num={1}>
            Tippe auf <IOSShareIcon /> in der Symbolleiste
          </Step>
          <Step num={2}>
            Scrolle und tippe auf{" "}
            <strong className="font-semibold">„Zum Home-Bildschirm"</strong>
          </Step>
          <Step num={3}>
            Bestätige mit{" "}
            <strong className="font-semibold">„Hinzufügen"</strong>
          </Step>
        </div>
      );

    case "ios-safari-26":
      return (
        <div className="flex flex-col gap-4">
          <Step num={1}>
            Tippe auf <DotsHorizontalIcon /> rechts neben der Adressleiste
          </Step>
          <Step num={2}>
            Tippe auf <IOSShareIcon />{" "}
            <strong className="font-semibold">„Teilen"</strong>
          </Step>
          <Step num={3}>
            Scrolle und tippe auf{" "}
            <strong className="font-semibold">„Zum Home-Bildschirm"</strong>
          </Step>
          <Step num={4}>
            Stelle sicher, dass{" "}
            <strong className="font-semibold">„Als Web-App öffnen"</strong>{" "}
            aktiviert ist, dann tippe auf{" "}
            <strong className="font-semibold">„Hinzufügen"</strong>
          </Step>
        </div>
      );

    case "ios-chrome":
    case "ios-firefox":
    case "ios-edge":
      return (
        <div className="flex flex-col gap-4">
          <Step num={1}>
            Kopiere den Link dieser Seite:
            <button
              onClick={copyLink}
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all tap-btn"
              style={{
                background: copied ? "rgba(34,197,94,0.12)" : "var(--surface-3)",
                border: "1px solid var(--border)",
                color: copied ? "#22c55e" : "var(--foreground)",
              }}
            >
              {copied ? "✓ Kopiert" : "Link kopieren"}
            </button>
          </Step>
          <Step num={2}>
            Öffne <strong className="font-semibold">Safari</strong> und füge den Link ein
          </Step>
          <Step num={3}>
            Tippe auf <IOSShareIcon /> und dann auf{" "}
            <strong className="font-semibold">„Zum Home-Bildschirm"</strong>
          </Step>
        </div>
      );

    case "android-chrome":
      return (
        <div className="flex flex-col gap-4">
          {deferredPrompt ? (
            <button
              onClick={triggerInstall}
              className="w-full py-3 rounded-2xl text-white font-semibold text-sm tap-btn gradient-glow"
              style={{ background: "linear-gradient(135deg, #ff4d42, #ff8a2a)" }}
            >
              Jetzt installieren
            </button>
          ) : (
            <>
              <Step num={1}>
                Tippe auf <DotsVerticalIcon /> oben rechts im Browser
              </Step>
              <Step num={2}>
                Tippe auf{" "}
                <strong className="font-semibold">„App installieren"</strong>
              </Step>
            </>
          )}
        </div>
      );

    case "android-firefox":
      return (
        <div className="flex flex-col gap-4">
          <Step num={1}>
            Tippe auf <DotsVerticalIcon /> unten rechts im Browser
          </Step>
          <Step num={2}>
            Tippe auf{" "}
            <strong className="font-semibold">„Zum Startbildschirm hinzufügen"</strong>
          </Step>
        </div>
      );

    case "android-samsung":
      return (
        <div className="flex flex-col gap-4">
          <Step num={1}>
            Tippe auf <HamburgerIcon /> unten rechts im Browser
          </Step>
          <Step num={2}>
            Tippe auf{" "}
            <strong className="font-semibold">„Seite hinzufügen zu"</strong>
          </Step>
          <Step num={3}>
            Wähle <strong className="font-semibold">„Startbildschirm"</strong>
          </Step>
        </div>
      );

    case "desktop-chrome":
    case "desktop-edge":
      return (
        <div className="flex flex-col gap-4">
          {deferredPrompt ? (
            <button
              onClick={triggerInstall}
              className="w-full py-3 rounded-2xl text-white font-semibold text-sm tap-btn gradient-glow"
              style={{ background: "linear-gradient(135deg, #ff4d42, #ff8a2a)" }}
            >
              Jetzt installieren
            </button>
          ) : (
            <Step num={1}>
              Klicke auf das <strong className="font-semibold">Installations-Symbol</strong> in der
              Adressleiste oben rechts
            </Step>
          )}
        </div>
      );
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AddToHomeScreenPrompt() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isRunningAsPWA()) return;

    const p = detectPlatform();
    if (!p) return;

    setPlatform(p);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const timer = setTimeout(() => setVisible(true), 600);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  if (!platform || !visible) return null;

  const showArrow = platform === "ios-safari" || platform === "ios-safari-26";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-5"
      style={{
        background: "var(--overlay)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={() => setVisible(false)}
    >
      <div
        className="glass-card w-full max-w-sm p-6 relative anim-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center tap-btn"
          style={{ background: "var(--surface-3)", color: "var(--muted)" }}
        >
          <X size={13} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pr-6">
          <img
            src="/apple-touch-icon.png"
            alt="App Icon"
            className="w-11 h-11 rounded-xl flex-shrink-0"
            style={{ boxShadow: "var(--shadow-sm)" }}
          />
          <div>
            <div className="text-title text-[15px]">App installieren</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Startup Contacts zum Home-Bildschirm hinzufügen
            </div>
          </div>
        </div>

        {/* Steps */}
        <PlatformContent
          platform={platform}
          deferredPrompt={deferredPrompt}
          onInstalled={() => setVisible(false)}
        />
      </div>
      {showArrow && <BouncingArrow platform={platform} />}
    </div>
  );
}
