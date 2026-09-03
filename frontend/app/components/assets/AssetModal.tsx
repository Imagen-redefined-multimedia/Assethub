"use client";

import type {
  AssetForm,
  User,
} from "@/types/asset";
import AssetFormComponent from "./AssetForm";

type AssetModalProps = {
  open: boolean;
  isEditing: boolean;
  form: AssetForm;
  clients: User[];
  saving: boolean;
  error: string;
  onChange: (
    field: keyof AssetForm,
    value: string
  ) => void;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>
  ) => void;
  onClose: () => void;
};

export default function AssetModal({
  open,
  isEditing,
  form,
  clients,
  saving,
  error,
  onChange,
  onSubmit,
  onClose,
}: AssetModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="border-b border-slate-800 p-6">
          <h2 className="text-xl font-semibold text-white">
            {isEditing
              ? "Edit Asset"
              : "Add Asset"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {isEditing
              ? "Update the asset information."
              : "Register a new company asset."}
          </p>
        </div>

        <AssetFormComponent
          form={form}
          clients={clients}
          saving={saving}
          isEditing={isEditing}
          error={error}
          onChange={onChange}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}