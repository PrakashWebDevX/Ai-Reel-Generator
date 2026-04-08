export default function Header() {
  return (
    <header className="flex items-center justify-between w-full max-w-5xl px-6 py-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-2xl">
          🎬
        </div>
        <div className="font-bold text-2xl tracking-tighter">AI Reel Generator</div>
      </div>
      <div className="text-sm text-zinc-400">Made for DigitalWealthBuilder</div>
    </header>
  );
}
