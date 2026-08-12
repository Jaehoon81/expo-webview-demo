import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DemoShell } from "@/src/components/DemoShell";
import { useAppStore } from "@/src/store/app-store";

export default function IndexScreen() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);

  if (!hasHydrated) {
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
