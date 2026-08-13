// [파일 역할] 공통 탭 정의를 네 개 접근 가능한 Pressable로 표시하고 선택 index를 DemoShell에 전달합니다.
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_DEFINITIONS } from "@/src/constants/tabs";
import type { TabIndex } from "@/src/types/navigation";

export const BOTTOM_TAB_BASE_HEIGHT = 60;

type BottomTabBarProps = {
  selectedIndex: TabIndex;
  onSelect: (index: TabIndex) => void;
};

export function BottomTabBar({
  selectedIndex,
  onSelect,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // [FLOW-08 / 5단계] bar 자체가 bottom safe-area padding을 소유하며 DemoShell은 이 전체 높이를 animation/inset 계산에 사용합니다.
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      {TAB_DEFINITIONS.map((tab) => {
        const selected = selectedIndex === tab.index;

        return (
          <Pressable
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={tab.tag}
            onPress={() => {
              // [FLOW-02 / 3단계] 화면 component는 tab 동작을 판단하지 않고 type-safe index만 parent selector에 전달합니다.
              onSelect(tab.index);
            }}
            style={({ pressed }) => [
              styles.tab,
              pressed && styles.pressedTab,
            ]}
          >
            <Ionicons
              color={selected ? "#4F46E5" : "#64748B"}
              name={selected ? tab.selectedIcon : tab.icon}
              size={23}
            />
            <Text style={[styles.label, selected && styles.selectedLabel]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: BOTTOM_TAB_BASE_HEIGHT,
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 8,
  },
  tab: {
    flex: 1,
    minHeight: BOTTOM_TAB_BASE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  pressedTab: {
    backgroundColor: "#F8FAFC",
  },
  label: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },
  selectedLabel: {
    color: "#4F46E5",
    fontWeight: "800",
  },
});
