import { SafeAreaView } from "react-native-safe-area-context";

import { DemoShell } from "@/src/components/DemoShell";

export default function IndexScreen() {
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <DemoShell />
    </SafeAreaView>
  );
}
