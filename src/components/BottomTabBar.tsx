// [파일 역할] 탭 정의 배열을 네 개의 누를 수 있는 버튼으로 보여 주고, 누른 탭 번호를 DemoShell에 알립니다.
// [라이브러리] Ionicons가 icon을 그립니다. `Pressable`은 누름 상태와 화면 읽기 도구용 버튼 정보를 제공합니다.

// ========================================== 외부 의존성 ==========================================

import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_DEFINITIONS } from "@/src/constants/tabs";
import type { TabIndex } from "@/src/types/navigation";

// =================================================================================================

// ======================================== component 계약 =========================================

// 탭 내용 자체의 높이입니다. 실제 하단 바 높이에는 기기 아래쪽 안전 여백이 더해집니다.
export const BOTTOM_TAB_BASE_HEIGHT = 60;

// [문법] `onSelect`가 받는 값을 TabIndex로 정해 자식 화면이 0~3 밖의 번호를 보낼 수 없게 합니다.
type BottomTabBarProps = {
  selectedIndex: TabIndex;
  // [역할] `onSelect`는 사용자가 누른 탭 번호를 실제 탭 전환을 담당하는 DemoShell에 보내는 함수 계약입니다.
  onSelect: (index: TabIndex) => void;
};

// =================================================================================================

// ==================================== BottomTabBar component =====================================

// [역할] `BottomTabBar`는 탭 정의 네 개를 버튼으로 보여 주고 선택한 번호를 부모 화면에 알립니다.
// [문법] 함수 입력의 `{ selectedIndex, onSelect }`는 props 객체에서 두 값을 바로 꺼내는 구조 분해입니다.
export function BottomTabBar({
  selectedIndex,
  onSelect,
}: BottomTabBarProps) {
  // [라이브러리] `useSafeAreaInsets`는 현재 기기의 안전 여백을 읽습니다. 회전하면 새 여백으로 화면을 다시 그립니다.
  // [역할] `useSafeAreaInsets`는 현재 기기의 아래 안전 여백을 하단 탭 높이 계산에 제공합니다.
  const insets = useSafeAreaInsets();

  // --------------------------------------- 탭 버튼 만들기 ----------------------------------------

  // [FLOW-08 / 8단계] `BottomTabBar`는 같은 safe-area bottom을 실제 padding으로 적용해 animation 거리와 보이는 높이를 맞춥니다.
  // DemoShell은 내용 높이와 이 여백을 더해 바를 숨길 거리와 화면 아래 여백을 계산합니다.
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      {TAB_DEFINITIONS.map((tab) => {
        // [역할] `map` callback은 탭 정의 하나를 선택 상태와 누름 동작을 가진 버튼 하나로 바꿉니다.
        // [문법] `map`은 탭 정의 하나를 `Pressable` 하나로 바꿔 네 버튼 배열을 만듭니다.
        const selected = selectedIndex === tab.index;

        // `key`에 고정된 tag를 넣어 React가 다시 그릴 때도 같은 탭 버튼임을 알아보게 합니다.
        // style 함수의 `pressed`는 누르는 동안만 true입니다. `&&` 뒤 style도 그때만 추가됩니다.
        return (
          <Pressable
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={tab.tag}
            onPress={() => {
              // [역할] `onPress` callback은 이 버튼의 탭 번호만 DemoShell의 선택 함수에 전달합니다.
              // [FLOW-02 / 6단계] 사용자가 버튼을 누르면 React Native가 `onPress`를 호출하고 이 callback은 `onSelect(tab.index)`를 실행합니다.
              onSelect(tab.index);
            }}
            // [역할] style callback은 버튼을 누르는 동안에만 눌림 배경 style을 더합니다.
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

  // -----------------------------------------------------------------------------------------------

}

// =================================================================================================

// ========================================== 화면 style ===========================================

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

// =================================================================================================
