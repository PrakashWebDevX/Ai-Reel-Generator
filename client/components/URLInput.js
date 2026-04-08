export default function URLInput({ value, onChange, disabled }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="Paste YouTube or Instagram video URL here..."
      className="w-full px-6 py-4 bg-zinc-900 border border-zinc-700 rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 text-lg"
    />
  );
}
