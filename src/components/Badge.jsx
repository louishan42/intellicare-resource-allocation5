export default function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    good: "bg-primary-100 text-primary-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    info: "bg-sky-50 text-sky-700",
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${tones[tone] || tones.neutral}`}>
      {children}
    </span>
  );
}
