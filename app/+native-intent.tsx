import { rewriteIncomingSystemPath } from "@/src/services/native-intent";

export function redirectSystemPath({ path }: {
  path: string;
  initial: boolean;
}): string {
  return rewriteIncomingSystemPath(path);
}
