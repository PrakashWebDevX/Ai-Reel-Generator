export default function GenerateButton({ onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full mt-6 py-5 px-8 text-lg font-bold text-white rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed btn-primary glow-sm relative overflow-hidden"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-3">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Generating...
        </span>
      ) : (
        "Generate Viral Reel"
      )}
    </button>
  );
}
