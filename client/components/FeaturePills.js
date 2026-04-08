export default function FeaturePills() {
  const features = [
    "No video download",
    "Original AI script",
    "Natural voiceover",
    "Burned-in subtitles",
    "1080×1920 vertical",
    "Ready for TikTok / Reels"
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {features.map((f, i) => (
        <div key={i} className="px-5 py-2 bg-zinc-900/70 border border-zinc-700 rounded-full text-sm text-zinc-300">
          {f}
        </div>
      ))}
    </div>
  );
}
