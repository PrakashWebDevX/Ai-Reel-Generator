export default function LoadingSteps({ currentStep }) {
  const steps = [
    "Extracting transcript...",
    "Writing viral script...",
    "Generating voiceover...",
    "Composing video with subtitles..."
  ];

  return (
    <div className="space-y-4">
      {steps.map((step, i) => (
        <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border ${i < currentStep ? 'border-green-500 bg-green-950/30' : i === currentStep ? 'border-purple-500 bg-purple-950/30' : 'border-zinc-800'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${i < currentStep ? 'bg-green-500' : i === currentStep ? 'bg-purple-500 animate-pulse' : 'bg-zinc-700'}`}>
            {i < currentStep ? '✓' : i + 1}
          </div>
          <span className={i < currentStep ? 'line-through text-green-400' : ''}>{step}</span>
        </div>
      ))}
    </div>
  );
}
