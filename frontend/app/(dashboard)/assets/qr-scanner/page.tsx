
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function QRScannerPage() {
  const router = useRouter();

  const scannerRef = useRef<any>(null);
  const startedRef = useRef(false);
  const scannedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cameraStarted, setCameraStarted] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      try {
        setLoading(true);
        setError("");

        const { Html5Qrcode } = await import(
          "html5-qrcode"
        );

        if (!mounted || startedRef.current) {
          return;
        }

        startedRef.current = true;

        const scanner = new Html5Qrcode(
          "qr-reader"
        );

        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
          aspectRatio: 1,
        };

        await scanner.start(
          {
            facingMode: "environment",
          },
          config,
          async (decodedText: string) => {
            if (scannedRef.current) {
              return;
            }

            scannedRef.current = true;

            try {
              await scanner.stop();
            } catch {
              // Scanner may already be stopped.
            }

            /*
             * Expected QR URL:
             *
             * https://your-frontend.com/assets/qr-scanner/<token>
             *
             * We extract the token from the URL.
             */

            let token = "";

            try {
              const url = new URL(decodedText);

              const parts = url.pathname
                .split("/")
                .filter(Boolean);

              const scannerIndex =
                parts.indexOf("qr-scanner");

              if (
                scannerIndex !== -1 &&
                parts[scannerIndex + 1]
              ) {
                token =
                  parts[scannerIndex + 1];
              }
            } catch {
              /*
               * If the QR contains only the token
               * instead of a full URL, use it directly.
               */
              token = decodedText.trim();
            }

            if (!token) {
              scannedRef.current = false;
              setError(
                "Invalid QR code. AssetHub could not find an asset token."
              );
              return;
            }

            router.push(
              `/assets/qr-scanner/${encodeURIComponent(
                token
              )}`
            );
          },
          () => {
            /*
             * QR not detected yet.
             *
             * We intentionally do not show an error
             * for every frame because that would make
             * the UI noisy while scanning.
             */
          }
        );

        if (mounted) {
          setCameraStarted(true);
          setLoading(false);
        }
      } catch (err) {
        console.error(
          "QR scanner error:",
          err
        );

        if (!mounted) {
          return;
        }

        setLoading(false);

        setError(
          "Unable to access the camera. Please allow camera permission and try again."
        );

        startedRef.current = false;
      }
    }

    startScanner();

    return () => {
      mounted = false;

      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
            startedRef.current = false;
          });
      }
    };
  }, [router]);

  function goBack() {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .catch(() => {});
    }

    router.push("/assets");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-medium text-blue-400">
          ASSET MANAGEMENT
        </p>

        <h1 className="mt-1 text-3xl font-bold text-white">
          Scan Asset QR Code
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Point your camera at an AssetHub QR code
          to identify the asset and begin an
          inspection.
        </p>
      </div>

      {/* Scanner card */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        {/* Camera header */}
        <div className="border-b border-slate-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">
                QR Scanner
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Position the QR code inside the frame.
              </p>
            </div>

            {cameraStarted && (
              <span className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Camera Active
              </span>
            )}
          </div>
        </div>

        {/* Camera */}
        <div className="relative bg-black p-4">
          <div
            id="qr-reader"
            className="w-full overflow-hidden rounded-xl"
          />

          {/* Scanner overlay */}
          {cameraStarted && (
            <div className="pointer-events-none absolute inset-4 flex items-center justify-center">
              <div className="relative h-[250px] w-[250px]">
                {/* Top left */}
                <div className="absolute left-0 top-0 h-10 w-10 border-l-4 border-t-4 border-blue-500" />

                {/* Top right */}
                <div className="absolute right-0 top-0 h-10 w-10 border-r-4 border-t-4 border-blue-500" />

                {/* Bottom left */}
                <div className="absolute bottom-0 left-0 h-10 w-10 border-b-4 border-l-4 border-blue-500" />

                {/* Bottom right */}
                <div className="absolute bottom-0 right-0 h-10 w-10 border-b-4 border-r-4 border-blue-500" />

                {/* Scan line */}
                <div className="absolute left-3 right-3 top-1/2 h-0.5 animate-pulse bg-blue-500" />
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

                <p className="mt-4 text-sm font-medium text-white">
                  Starting camera...
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Please allow camera access.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl border border-red-900/70 bg-red-950/30 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 font-bold text-red-400">
                  !
                </div>

                <div>
                  <p className="font-medium text-red-300">
                    Camera Error
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!error && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                  i
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    How to scan
                  </p>

                  <ol className="mt-2 space-y-1 text-sm leading-6 text-slate-500">
                    <li>
                      1. Hold the QR code in front
                      of the camera.
                    </li>

                    <li>
                      2. Keep the QR code inside
                      the scanning frame.
                    </li>

                    <li>
                      3. AssetHub will automatically
                      verify the asset.
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Back button */}
          <button
            type="button"
            onClick={goBack}
            className="w-full rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Back to Assets
          </button>
        </div>
      </section>
    </div>
  );
}

