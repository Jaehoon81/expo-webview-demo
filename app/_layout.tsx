import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { queryClient } from "@/src/query-client";
import { useAppStore } from "@/src/store/app-store";

export default function RootLayout() {
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
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
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
