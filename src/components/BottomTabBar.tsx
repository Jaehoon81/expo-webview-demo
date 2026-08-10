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
