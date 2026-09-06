type TipEntry = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
};

export function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-muted">{String(label)}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} style={{ color: p.color }} className="tabular">
          {String(p.name)}: {typeof p.value === "number" ? p.value.toLocaleString() : String(p.value)}
        </p>
      ))}
    </div>
  );
}