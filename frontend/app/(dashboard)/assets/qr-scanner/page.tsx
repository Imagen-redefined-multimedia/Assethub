
"use client";

import { useEffect, useRef, useState } from "react";
import { apiJson } from "@/lib/api";

type Asset = {
  id: number;
  name: string;
  serial_number: string;
  description?: string;
  company?: number | null;
  company_name?: string;
  client?: number;
  client_username?: string;
  qr_active: boolean;
  last_qr_scan_at?: string | null;
};

type QRScanResponse = Asset;

export default function QRScannerPage() {
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const scannerInstanceRef = useRef<any>(null);

  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [error, setError] = useState("");
  const [manualToken, setManualToken] = useState("");

  async function scanQRCode(token: string) {
    if (!token) {
      setError("Invalid QR code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAsset(null);

      const data = await apiJson<QRScanResponse>(
        `/api/qr/scan/${encodeURIComponent(token)}/`,
        {
          method: "POST",
        }
      );

      setAsset(data);

      await stopScanner();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to scan QR code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function startScanner() {
    try {
      setError("");
      setAsset(null);
      setScanning(true);

      const { Html5Qrcode } = await import("html5-qrcode");

      if (!scannerRef.current) {
        throw new Error("Scanner container is unavailable.");
      }

      const scanner = new Html5Qrcode("asset-qr-reader");

      scannerInstanceRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText: string) => {
          await handleQRCode(decodedText);
        },
        () => {
          // Ignore individual scan failures.
        }
      );
    } catch (err) {
      setScanning(false);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to start camera."
      );
    }
  }

  async function handleQRCode(decodedText: string) {
    let token = decodedText.trim();

    /*
     * If the QR contains a URL such as:
     *
     * https://frontend.com/assets/qr-scanner/ABC123
     *
     * extract the token from the URL.
     */
    try {
      const url = new URL(token);

      const parts = url.pathname
        .split("/")
        .filter(Boolean);

      const scannerIndex = parts.indexOf("qr-scanner");

      if (scannerIndex !== -1) {
        token = parts[scannerIndex + 1] ?? "";
      }
    } catch {
      // QR contains a raw token.
    }

    await scanQRCode(token);
  }

  async function stopScanner() {
    const scanner = scannerInstanceRef.current;

    if (!scanner) {
      setScanning(false);
      return;
    }

    try {
      await scanner.stop();
      await scanner.clear();
    } catch {
      // Scanner may already be stopped.
    }

    scannerInstanceRef.current = null;
    setScanning(false);
  }

  async function handleManualScan(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    await scanQRCode(manualToken.trim());
  }

  useEffect(() => {
    return () => {
      const scanner = scannerInstanceRef.current;

      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            scanner
              .clear()
              .catch(() => {});
          });
      }
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}

      <div>
        <p className="text-sm font-medium text-blue-400">
          ASSET MANAGEMENT
        </p>

        <h1 className="mt-1 text-3xl font-bold text-white">
          QR Scanner
        </h1>

        <p className="mt-2 text-slate-400">
          Scan an AssetHub QR code to identify an asset.
        </p>
      </div>

      {/* Error */}

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/30 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Scanner */}

      {!asset && (
        <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h2 className="font-semibold text-white">
              Scan Asset QR Code
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Position the QR code inside the scanning area.
            </p>
          </div>

          <div className="p-6">
            <div
              id="asset-qr-reader"
              ref={scannerRef}
              className="overflow-hidden rounded-xl"
            />

            {!scanning && (
              <button
                type="button"
                onClick={startScanner}
                disabled={loading}
                className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                Start Camera
              </button>
            )}

            {scanning && (
              <button
                type="button"
                onClick={stopScanner}
                className="mt-5 w-full rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Stop Scanner
              </button>
            )}
          </div>

          {/* Manual fallback */}

          <div className="border-t border-slate-800 p-6">
            <p className="mb-3 text-sm font-medium text-slate-300">
              Manual QR Token
            </p>

            <form
              onSubmit={handleManualScan}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="text"
                value={manualToken}
                onChange={(event) =>
                  setManualToken(event.target.value)
                }
                placeholder="Enter QR token"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={loading || !manualToken.trim()}
                className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Scanning..." : "Scan"}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Asset Result */}

      {asset && (
        <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 bg-emerald-950/20 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                ✓
              </div>

              <div>
                <h2 className="font-semibold text-white">
                  Asset Found
                </h2>

                <p className="text-sm text-slate-500">
                  QR code verified successfully.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <AssetInfo
              label="Asset"
              value={asset.name}
            />

            <AssetInfo
              label="Serial Number"
              value={asset.serial_number}
            />

            {asset.company_name && (
              <AssetInfo
                label="Company"
                value={asset.company_name}
              />
            )}

            {asset.client_username && (
              <AssetInfo
                label="Client"
                value={asset.client_username}
              />
            )}

            {asset.description && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Description
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  {asset.description}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-3">
              <span className="text-sm text-slate-400">
                QR Status
              </span>

              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                Active
              </span>
            </div>

            <div className="grid gap-3 pt-4 sm:grid-cols-2">
              <button
                type="button"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Start Inspection
              </button>

              <button
                type="button"
                onClick={() => {
                  setAsset(null);
                  setError("");
                }}
                className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Scan Another
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function AssetInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-white">
        {value}
      </p>
    </div>
  );
}

