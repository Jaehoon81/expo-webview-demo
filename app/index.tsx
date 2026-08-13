// [파일 역할] 단일 index route에서 저장된 탭 설정의 복원이 끝날 때까지 loading을 표시한 뒤 DemoShell을 mount합니다.
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DemoShell } from "@/src/components/DemoShell";
import { useAppStore } from "@/src/store/app-store";

export default function IndexScreen() {
  // [FLOW-01 / 2단계] persist middleware가 완료 신호를 바꿀 때 이 selector만 다시 render됩니다.
  const hasHydrated = useAppStore((state) => state.hasHydrated);

  if (!hasHydrated) {
    // [이유] loading gate를 Root Stack 안의 route에 두면 cold custom scheme에서도 router.setParams보다 Stack이 먼저 존재합니다.
    return (
      <View
        accessibilityLabel="저장된 앱 설정을 불러오는 중"
        accessibilityRole="progressbar"
        style={styles.centered}
      >
        <ActivityIndicator size="large" />
        <Text style={styles.message}>앱 설정을 불러오고 있습니다.</Text>
      </View>
    );
  }

  // [FLOW-01 / 5단계] 유효한 복원값 또는 안전한 기본값이 확정된 뒤에만 실제 탭 shell을 만듭니다.
  // SafeAreaView는 상단 inset만 소유하고 하단 inset은 BottomTabBar가 별도로 계산합니다.
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <DemoShell />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  message: {
    color: "#475569",
    fontSize: 15,
  },
});
