type AssetEmptyStateProps = {
  hasSearch: boolean;
  onAdd: () => void;
};

export default function AssetEmptyState({
  hasSearch,
  onAdd,
}: AssetEmptyStateProps) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl text-slate-500">
        ◈
      </div>

      <h3 className="mt-4 font-semibold text-white">
        {hasSearch
          ? "No assets found"
          : "No assets yet"}
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        {hasSearch
          ? "Try a different search term."
          : "Create your first asset to get started."}
      </p>

      {!hasSearch && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Add Asset
        </button>
      )}
    </div>
  );
}