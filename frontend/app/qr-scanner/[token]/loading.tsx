export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

        <p className="mt-4 text-sm font-medium text-white">
          Loading QR code...
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Please wait while AssetHub loads the asset information.
        </p>
      </div>
    </div>
  );
}