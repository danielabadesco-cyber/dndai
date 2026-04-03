interface StatControlProps {
  label: string;
  value: number;
  maxValue?: number;
  onChange: (value: number) => void;
  color?: string;
}

export default function StatControl({ label, value, maxValue, onChange, color = 'var(--color-primary)' }: StatControlProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg"
      style={{ backgroundColor: 'var(--color-surface-light)' }}>
      <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(value - 1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-lg font-bold"
          style={{ backgroundColor: 'var(--color-danger)' }}
        >
          -
        </button>
        <span className="w-16 text-center font-bold text-lg" style={{ color }}>
          {maxValue !== undefined ? `${value}/${maxValue}` : value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-lg font-bold"
          style={{ backgroundColor: 'var(--color-success)' }}
        >
          +
        </button>
      </div>
    </div>
  );
}
