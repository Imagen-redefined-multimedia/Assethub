import type { Asset } from "@/types/asset";
import AssetRow from "./AssetRow";

type AssetTableProps = {
  assets: Asset[];
  qrLoading: number | null;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  isAdmin: boolean;
  isTechnician: boolean;
  isClient: boolean;
};

export default function AssetTable({
  assets,
  qrLoading,
  onEdit,
  onDelete,
  isAdmin,
  isTechnician,
  isClient,
}: AssetTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px]">
        <thead>
          <tr className="border-b border-slate-800 text-left">
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Asset
            </th>

            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Company
            </th>

            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Client
            </th>

            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              QR Status
            </th>

            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-800">
          {assets.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              qrLoading={qrLoading}
              onEdit={onEdit}
              onDelete={onDelete}
              isAdmin={isAdmin}
              isTechnician={isTechnician}
              isClient={isClient}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}