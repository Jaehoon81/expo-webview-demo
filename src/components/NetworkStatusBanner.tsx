// [파일 역할] DemoShell이 인터넷 연결 없음으로 판단하면 모든 탭 위에 계속 보이는 안내를 표시합니다.
// [라이브러리] accessibility props는 화면 읽기 도구에도 이 안내가 나타났다고 알려 줍니다.

// ========================================== 외부 의존성 ==========================================

import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// =================================================================================================

// ======================================== component 계약 =========================================

type NetworkStatusBannerProps = {
  visible: boolean;
};

// =================================================================================================

// ================================= NetworkStatusBanner component =================================

// [역할] `NetworkStatusBanner`는 offline일 때만 연결 안내를 접근성 alert와 함께 보여 줍니다.
export function NetworkStatusBanner({
  visible,
}: NetworkStatusBannerProps) {
  // [문법] 보일 필요가 없으면 `null`을 return합니다. 이때 React는 안내 View를 만들지 않습니다.
  if (!visible) {
    return null;
  }

  // [FLOW-09 / 3단계] 연결 상태가 NONE일 때만 안내를 만듭니다. 개별 웹/API 요청 성공 여부를 판단하지는 않습니다.
  // [라이브러리] `accessibilityLiveRegion="polite"`와 alert role은 새 안내를 화면 읽기 도구가 읽게 합니다.
  return (
    <View
      accessible
      accessibilityLabel="네트워크 연결 없음"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={styles.container}
    >
      <Ionicons color="#9A3412" name="cloud-offline-outline" size={19} />
      <Text style={styles.message}>
        네트워크에 연결되어 있지 않습니다.
      </Text>
    </View>
  );
}

// =================================================================================================

// ========================================== 화면 style ===========================================

// 아래 style은 모양만 정합니다. 안내를 만들고 없애는 조건은 위 `visible`과 return이 결정합니다.
const styles = StyleSheet.create({
  container: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#FDBA74",
    backgroundColor: "#FFF7ED",
  },
  message: {
    color: "#9A3412",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});

// =================================================================================================
