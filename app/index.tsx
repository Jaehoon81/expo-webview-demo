// [파일 역할] 저장된 탭을 모두 불러올 때까지 로딩 화면을 보여 주고, 끝나면 실제 앱 화면을 보여 줍니다.
// [라이브러리] React Native의 View·Text는 웹의 DOM이 아니라 Android/iOS 화면 요소로 만들어집니다.

// ========================================== 외부 의존성 ==========================================

import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
// [라이브러리] `SafeAreaView`는 notch나 status bar에 내용이 가리지 않도록 지정한 방향에 여백을 더합니다.
import { SafeAreaView } from "react-native-safe-area-context";

import { DemoShell } from "@/src/components/DemoShell";
import { useAppStore } from "@/src/store/app-store";

// =================================================================================================

// ======================================== hydration 화면 =========================================

// [역할] `IndexScreen`은 저장값을 읽는 동안 loading을 보여 주고, 완료된 뒤에만 `DemoShell`을 만듭니다.
export default function IndexScreen() {
  // [FLOW-01 / 2단계] Zustand가 저장값 읽기를 마치면 `hasHydrated`가 바뀌고 이 화면을 다시 그립니다.
  // [라이브러리] 이 selector는 store 전체가 아니라 `hasHydrated` 하나만 지켜봅니다.
  // [역할] selector callback은 Zustand state에서 저장값 읽기 완료 여부만 골라냅니다.
  const hasHydrated = useAppStore((state) => state.hasHydrated);

  // [문법] 아직 준비되지 않았으면 여기서 바로 return합니다. 그래서 로딩 화면과 실제 화면이 함께 나타나지 않습니다.
  if (!hasHydrated) {
    // [이유] 로딩 화면을 Root Stack 안에 두면 주소로 앱을 처음 열어도 Stack이 먼저 준비됩니다.
    // [라이브러리] `accessibilityRole="progressbar"`는 화면 읽기 도구에 현재 작업이 진행 중이라고 알려 줍니다.
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

  // [FLOW-01 / 5단계] 저장된 탭이나 기본 탭이 정해진 뒤에만 실제 탭 화면을 만듭니다.
  // [라이브러리] `edges={["top"]}`은 위쪽 안전 여백만 이곳에서 넣겠다는 뜻입니다.
  // 아래쪽 여백은 BottomTabBar가 기기에 맞춰 따로 계산합니다.
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <DemoShell />
    </SafeAreaView>
  );
}

// =================================================================================================

// ========================================== 화면 style ===========================================

// [문법] `StyleSheet.create`로 이름 있는 style을 만들면 `styles.centered`처럼 여러 곳에서 다시 쓸 수 있습니다.
// 색상이나 margin처럼 눈에 보이는 단순 값은 한 줄씩 설명하지 않습니다.
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

// =================================================================================================
