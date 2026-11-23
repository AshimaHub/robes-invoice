/** Legacy redirects read dynamic params; allow a blocking render. */
export const instant = false;

export default function LegacyAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
