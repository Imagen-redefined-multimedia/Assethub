type AssetToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export default function AssetToolbar({
  search,
  onSearchChange,
}: AssetToolbarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-800 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="font-semibold text-white">
          Registered Assets
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          View and manage assets across registered companies.
        </p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) =>
          onSearchChange(event.target.value)
        }
        placeholder="Search assets..."
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 md:w-80"
      />
    </div>
  );
}