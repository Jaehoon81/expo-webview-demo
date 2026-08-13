// [파일 역할] ToastAndroid가 없는 iOS에서 bridge message를 3초 동안 표시하고 수동 닫기도 제공합니다.
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type SnackbarProps = {
  message: string | null;
  onDismiss: () => void;
};

export function Snackbar({ message, onDismiss }: SnackbarProps) {
  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(onDismiss, 3_000);
    return () => {
      // message 변경이나 unmount 때 이전 timer가 새 message를 조기에 닫지 않도록 취소합니다.
      clearTimeout(timer);
    };
  }, [message, onDismiss]);

  if (!message) {
    return null;
  }

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
}

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
