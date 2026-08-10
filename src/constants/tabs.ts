import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

import type { TabIndex, TabTag } from "@/src/types/navigation";

export type TabDefinition = {
  index: TabIndex;
  tag: TabTag;
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  selectedIcon: ComponentProps<typeof Ionicons>["name"];
  initialUrl: string | null;
};

export const TAB_DEFINITIONS: readonly TabDefinition[] = [
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
