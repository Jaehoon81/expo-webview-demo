// [파일 역할] 네 탭의 순서, 이름, icon, 처음 열 주소를 한 배열에서 관리합니다.
// [문법] `import type`은 TypeScript가 코드를 검사할 때만 필요합니다. 실행할 JavaScript에는 포함되지 않습니다.

// ========================================== 외부 의존성 ==========================================

import type { ComponentProps } from "react";
// [라이브러리] Expo Vector Icons의 `Ionicons`가 각 탭에 표시할 icon을 그립니다.
import { Ionicons } from "@expo/vector-icons";

import type { TabIndex, TabTag } from "@/src/types/navigation";

// =================================================================================================

// ========================================= 탭 표시 계약 ==========================================

export type TabDefinition = {
  // [주의] index와 tag는 WebView 목록, deep link, bridge가 모두 함께 사용합니다. 한 곳만 바꾸면 서로 어긋납니다.
  index: TabIndex;
  tag: TabTag;
  label: string;
  // [문법] `ComponentProps<typeof Ionicons>["name"]`은 Ionicons가 허용하는 name만 골라 type으로 사용합니다.
  // 잘못된 icon 이름을 쓰면 앱을 실행하기 전에 TypeScript가 알려 줍니다.
  icon: ComponentProps<typeof Ionicons>["name"];
  selectedIcon: ComponentProps<typeof Ionicons>["name"];
  // `null`은 local HTML 탭과 native 탭처럼 처음 열 외부 주소가 없다는 뜻입니다.
  initialUrl: string | null;
};

// [문법] `readonly`는 이 배열을 사용하는 코드가 `push`나 `splice`로 탭 순서를 바꾸지 못하게 합니다.
export const TAB_DEFINITIONS: readonly TabDefinition[] = [
  // [FLOW-02 / 2단계] `DemoShell`과 `BottomTabBar`가 이 같은 배열을 읽어 화면, 버튼, ref의 index·tag 순서를 맞춥니다.
  {
    index: 0,
    tag: "f0",
    label: "메인화면",
    icon: "home-outline",
    selectedIcon: "home",
    initialUrl: null,
  },
  {
    index: 1,
    tag: "f1",
    label: "네이버",
    icon: "navigate-outline",
    selectedIcon: "navigate",
    initialUrl: "https://m.naver.com",
  },
  {
    index: 2,
    tag: "f2",
    label: "다음",
    icon: "globe-outline",
    selectedIcon: "globe",
    initialUrl: "https://m.daum.net",
  },
  {
    index: 3,
    tag: "f3",
    label: "네이티브",
    icon: "people-outline",
    selectedIcon: "people",
    initialUrl: null,
  },
];

// =================================================================================================
