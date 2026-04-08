export default function ResultPanel({ result }) {
  if (!result) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
      <video controls className="w-full rounded-2xl mb-6 aspect-video" src={result.videoUrl} />
      <div className="space-y-6">
        <div>
          <div className="text-sm uppercase tracking-widest text-zinc-500 mb-2">Ready Caption</div>
          <div className="bg-zinc-950 p-5 rounded-2xl text-lg leading-relaxed whitespace-pre-wrap">{result.caption}</div>
        </div>
        <div>
          <div className="text-sm uppercase tracking-widest text-zinc-500 mb-2">Hashtags</div>
          <div className="flex flex-wrap gap-2">
            {result.hashtags?.map((tag, i) => (
              <span key={i} className="px-4 py-1.5 bg-zinc-800 rounded-full text-sm">#{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
