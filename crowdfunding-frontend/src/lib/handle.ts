export const makeHandle = (address?: string | null) => {
  if (!address) return "";
  const normalized = address.toLowerCase().replace(/^0x/, "");
  if (normalized.length < 8) return "phx-unknown";
  const prefix = normalized.slice(0, 4);
  const suffix = normalized.slice(-4);
  return `phx-${prefix}-${suffix}`;
};
