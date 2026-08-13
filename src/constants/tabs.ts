// [파일 역할] 네 탭의 index·bridge tag·표시 정보·최초 URL을 하나의 순서 있는 기준 배열로 정의합니다.
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

import type { TabIndex, TabTag } from "@/src/types/navigation";

export type TabDefinition = {
  // [주의] index와 tag는 WebView ref 배열, deep link target, bridge action이 함께 사용하는 공개 계약입니다.
  index: TabIndex;
  tag: TabTag;
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  selectedIcon: ComponentProps<typeof Ionicons>["name"];
  initialUrl: string | null;
};

export const TAB_DEFINITIONS: readonly TabDefinition[] = [
  // [FLOW-02 / 관련 코드] DemoShell과 BottomTabBar가 같은 배열을 읽으므로 화면 순서와 ref index가 어긋나지 않습니다.
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
