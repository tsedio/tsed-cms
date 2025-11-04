export function interpolate(str: string, scope: Record<string, unknown> = {}) {
  return str.replace(/\{(\w+)}/gi, (match: string, ...args) => {
    return (scope[args[0]] as string) || "";
  });
}
