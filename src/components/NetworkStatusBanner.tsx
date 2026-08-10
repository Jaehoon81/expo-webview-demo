import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type NetworkStatusBannerProps = {
  visible: boolean;
};

export function NetworkStatusBanner({
  visible,
}: NetworkStatusBannerProps) {
  if (!visible) {
    return null;
  }

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
