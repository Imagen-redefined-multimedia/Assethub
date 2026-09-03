import StatCard from "./StatCard";

type AssetStatsProps = {
  total: number;
  activeQr: number;
  searchResults: number;
};

export default function AssetStats({
  total,
  activeQr,
  searchResults,
}: AssetStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        title="Total Assets"
        value={total}
        icon="◈"
      />

      <StatCard
        title="Active QR Codes"
        value={activeQr}
        icon="▦"
      />

      <StatCard
        title="Search Results"
        value={searchResults}
        icon="⌕"
      />
    </div>
  );
}