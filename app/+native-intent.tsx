// [파일 역할] Expo Router가 OS에서 받은 system path를 route로 해석하기 전에 demo custom scheme만 index query로 재작성합니다.
// [검증 경계] 이 함수의 test는 문자열 변환만 증명하며 OS intent filter·앱 cold/warm launch는 development build 실기기 증거가 필요합니다.
import { rewriteIncomingSystemPath } from "@/src/services/native-intent";

export function redirectSystemPath({ path }: {
  path: string;
  initial: boolean;
}): string {
  // [FLOW-06 / 1단계] `initial` 여부와 관계없이 cold/warm system path를 같은 canonical 변환 함수로 보냅니다.
  return rewriteIncomingSystemPath(path);
}
