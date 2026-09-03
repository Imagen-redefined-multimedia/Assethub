type AssetHeaderProps = {
  onAdd: () => void;
  isAdmin: boolean;
};

export default function AssetHeader({
  onAdd,
  isAdmin,
}: AssetHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-medium text-blue-400">
          ASSET MANAGEMENT
        </p>

        <h1 className="mt-1 text-3xl font-bold text-white">
          Assets
        </h1>

        <p className="mt-2 text-slate-400">
          Manage company assets and their QR identification codes.
        </p>
      </div>

      {isAdmin && (
        <button
          type="button"
          onClick={onAdd}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          + Add Asset
        </button>
      )}
    </div>
  );
}