interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
  color?: string;
}

export function ProgressBar({ value, label, showPercent = true, color = "bg-primary-500" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-1.5">
      {(label || showPercent) && (
        <div className="flex justify-between text-xs text-gray-400">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-mono">{clamped}%</span>}
        </div>
      )}
      <div className="w-full bg-gray-700/40 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
