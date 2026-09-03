type FeedbackProps = {
  success?: string;
  error?: string;
  showError?: boolean;
};

export default function Feedback({
  success,
  error,
  showError = true,
}: FeedbackProps) {
  return (
    <div className="space-y-3">
      {success && (
        <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 px-5 py-4 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {error && showError && (
        <div className="rounded-xl border border-red-900 bg-red-950/30 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}