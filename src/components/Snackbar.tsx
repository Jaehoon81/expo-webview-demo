// [파일 역할] Android Toast가 없는 iOS에서 bridge 메시지를 3초 동안 보여 주고 직접 닫을 수도 있게 합니다.
// [라이브러리] `useEffect`가 메시지가 생길 때 timer를 만들고 메시지가 바뀌거나 화면이 사라질 때 정리합니다.

// ========================================== 외부 의존성 ==========================================

import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// =================================================================================================

// ======================================== component 계약 =========================================

type SnackbarProps = {
  // [문법] `string | null`은 보여 줄 문자열이 있거나, 아무 메시지도 없다는 null 중 하나입니다.
  message: string | null;
  // [역할] `onDismiss`는 timer나 닫기 버튼이 메시지를 없애 달라고 부모 화면에 알리는 함수 계약입니다.
  onDismiss: () => void;
};

// =================================================================================================

// ====================================== Snackbar component =======================================

// [역할] `Snackbar`는 iOS용 안내를 보여 주고 새 메시지마다 3초 뒤 닫을 timer를 관리합니다.
export function Snackbar({ message, onDismiss }: SnackbarProps) {

  // ---------------------------------------- message timer ----------------------------------------

  // [라이브러리] `useEffect`는 화면을 그린 뒤 실행됩니다. message나 onDismiss가 바뀌기 전에는 이전 정리 함수를 부릅니다.
  // [역할] `useEffect` callback은 메시지가 있을 때 자동 닫기 timer를 만들고 정리 함수를 등록합니다.
  useEffect(() => {
    if (!message) {
      // 메시지가 없으면 timer를 만들지 않고 바로 끝냅니다.
      return;
    }

    // [라이브러리] `setTimeout`은 3초 뒤 `onDismiss`를 한 번 실행합니다. 반환값은 취소할 때 쓰려고 보관합니다.
    const timer = setTimeout(onDismiss, 3_000);
    // [문법] `useEffect`가 돌려주는 함수는 화면에 표시되는 값이 아닙니다. React가 나중에 정리할 때 호출합니다.
    // [역할] 정리 callback은 메시지가 바뀌거나 화면이 사라질 때 이전 자동 닫기 timer를 취소합니다.
    return () => {
      // 메시지가 바뀌거나 Snackbar가 사라지면 이전 timer를 취소해 새 메시지를 너무 일찍 닫지 않게 합니다.
      clearTimeout(timer);
    };
    // message나 onDismiss 함수가 바뀌면 이전 timer를 지우고 새로 3초를 셉니다.
  }, [message, onDismiss]);

  // -----------------------------------------------------------------------------------------------

  // ------------------------------------------ 화면 출력 ------------------------------------------

  // 메시지가 없을 때는 화면도 `null`을 돌려줘 보이지 않는 Snackbar View를 남기지 않습니다.
  if (!message) {
    return null;
  }

  // [라이브러리] live region은 새 메시지가 나타났다고 화면 읽기 도구에 알려 줍니다.
  return (
    <View accessibilityLiveRegion="polite" style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        accessibilityLabel="메시지 닫기"
        accessibilityRole="button"
        onPress={onDismiss}
      >
        <Text style={styles.dismiss}>닫기</Text>
      </Pressable>
    </View>
  );

  // -----------------------------------------------------------------------------------------------

}

// =================================================================================================

// ========================================== 화면 style ===========================================

// absolute style은 앱 화면 위에 놓일 위치만 정합니다. 메시지를 언제 없앨지는 위 `useEffect`가 정합니다.
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    bottom: 84,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 6,
  },
  message: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
  },
  dismiss: {
    marginLeft: 16,
    color: "#C7D2FE",
    fontSize: 13,
    fontWeight: "700",
  },
});

// =================================================================================================
