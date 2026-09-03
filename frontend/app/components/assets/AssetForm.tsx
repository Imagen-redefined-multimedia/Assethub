"use client";

import type {
  AssetForm as AssetFormType,
  User,
} from "@/types/asset";

type AssetFormProps = {
  form: AssetFormType;
  clients: User[];
  saving: boolean;
  isEditing: boolean;
  error: string;
  onChange: (
    field: keyof AssetFormType,
    value: string
  ) => void;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>
  ) => void;
  onCancel: () => void;
};

export default function AssetForm({
  form,
  clients,
  saving,
  isEditing,
  error,
  onChange,
  onSubmit,
  onCancel,
}: AssetFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 p-6"
    >
      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Client */}
      <div>
        <label
          htmlFor="asset-client"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Client
        </label>

        <select
          id="asset-client"
          value={form.client}
          onChange={(event) =>
            onChange("client", event.target.value)
          }
          required
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
        >
          <option value="">
            Select client
          </option>

          {clients.map((client) => (
            <option
              key={client.id}
              value={client.id}
            >
              {client.username}
            </option>
          ))}
        </select>

        <p className="mt-2 text-xs text-slate-500">
          The client's company will be assigned automatically.
        </p>
      </div>

      {/* Asset Name */}
      <div>
        <label
          htmlFor="asset-name"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Asset Name
        </label>

        <input
          id="asset-name"
          type="text"
          value={form.name}
          onChange={(event) =>
            onChange("name", event.target.value)
          }
          required
          maxLength={255}
          placeholder="Industrial Generator"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
        />
      </div>

      {/* Serial */}
      <div>
        <label
          htmlFor="asset-serial"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Serial Number
        </label>

        <input
          id="asset-serial"
          type="text"
          value={form.serial_number}
          onChange={(event) =>
            onChange(
              "serial_number",
              event.target.value
            )
          }
          required
          maxLength={255}
          placeholder="GEN-2026-001"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="asset-description"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Description
        </label>

        <textarea
          id="asset-description"
          value={form.description}
          onChange={(event) =>
            onChange(
              "description",
              event.target.value
            )
          }
          rows={4}
          placeholder="Describe the asset..."
          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : isEditing
              ? "Save Changes"
              : "Create Asset"}
        </button>
      </div>
    </form>
  );
}