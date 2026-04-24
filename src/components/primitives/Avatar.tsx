export function Avatar({
  name = "",
  size = 36,
  src,
  color,
}: {
  name?: string;
  size?: number;
  src?: string;
  color?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const palette = ["#4F46E5", "#7E3000", "#0D9488", "#9333EA", "#2563EB", "#16A34A", "#D97706"];
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const bg = color || palette[hash % palette.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: src ? `url(${src}) center/cover` : `${bg}22`,
        color: bg,
        display: "grid",
        placeItems: "center",
        fontSize: size * 0.38,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        flexShrink: 0,
      }}
    >
      {!src && initials}
    </div>
  );
}
