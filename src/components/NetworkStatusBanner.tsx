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
    // [FLOW-09 / 5-B단계] online 또는 UNKNOWN branch는 `null`을 반환해 banner만 unmount하고 기존 request 결과는 유지합니다.
    return null;
  }

  // [FLOW-09 / 5-A단계] confirmed offline branch는 accessibility alert banner를 mount하지만 개별 request 성공 여부는 판단하지 않습니다.
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
