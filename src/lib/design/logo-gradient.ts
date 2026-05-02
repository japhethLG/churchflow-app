// Deterministic pair of gradient colors from a string (e.g. tenant slug).
// Ensures a tenant always gets the same palette without storing a color preference.

const PALETTES: [string, string][] = [
	["#4F46E5", "#3525CD"], // indigo
	["#0D9488", "#115E59"], // teal
	["#9333EA", "#5B21B6"], // purple
	["#D97706", "#92400E"], // amber
	["#2563EB", "#1E40AF"], // blue
	["#DC2626", "#991B1B"], // red
	["#059669", "#065F46"], // emerald
	["#7C3AED", "#4C1D95"], // violet
];

const hash = (s: string): number => {
	let h = 0;
	for (let i = 0; i < s.length; i++) {
		h = ((h << 5) - h + s.charCodeAt(i)) | 0;
	}
	return Math.abs(h);
};

export const tenantLogoGradient = (
	slug: string,
): { from: string; to: string } => {
	const [from, to] = PALETTES[hash(slug) % PALETTES.length]!;
	return { from, to };
};

export const tenantInitials = (name: string): string => {
	const words = name.trim().split(/\s+/);
	if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
	return (words[0]![0]! + words[1]![0]!).toUpperCase();
};
