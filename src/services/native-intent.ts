export function rewriteIncomingSystemPath(path: string): string {
  try {
    const url = new URL(path, "mywebviewapp://app.home");
    const normalizedPath = url.pathname.replace(/\/$/, "");
    const isDemoDeepLink =
      url.hostname === "webviewappdemo" ||
      normalizedPath.endsWith("/webviewappdemo");

    if (!isDemoDeepLink) {
      return path;
    }

    const canonicalUrl = new URL("mywebviewapp://webviewappdemo");
    url.searchParams.forEach((value, key) => {
      canonicalUrl.searchParams.append(key, value);
    });

    return `/?demoDeepLink=${encodeURIComponent(canonicalUrl.toString())}`;
  } catch {
    return "/";
  }
}
