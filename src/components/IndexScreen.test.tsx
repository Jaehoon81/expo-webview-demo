// [파일 역할] persisted store hydration 전 loading gate와 완료 뒤 DemoShell mount 순서를 화면 수준에서 검증합니다.
// [검증 경계] Zustand persist와 DemoShell은 mock이므로 실제 SecureStore 복원·Root Stack·cold deep link 동작을 증명하지 않습니다.
import { render, screen } from "@testing-library/react-native";

import IndexScreen from "@/app/index";
import { useAppStore } from "@/src/store/app-store";

jest.mock("@/src/components/DemoShell", () => {
  const { Text } = jest.requireActual("react-native");

  return {
    DemoShell: () => <Text>DemoShell mock</Text>,
  };
});

jest.mock("@/src/store/app-store", () => ({
  // selector가 받는 hasHydrated만 test가 직접 바꿀 수 있는 Hook 대역입니다.
  useAppStore: jest.fn(),
}));

const mockedUseAppStore = useAppStore as unknown as jest.Mock;

describe("IndexScreen hydration gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hydration 전에는 로딩 화면을 유지하고 완료 후 DemoShell을 mount한다", async () => {
    let hasHydrated = false;
    mockedUseAppStore.mockImplementation(
      (selector: (state: { hasHydrated: boolean }) => unknown) =>
        selector({ hasHydrated }),
    );

    const { rerender } = await render(<IndexScreen />);

    expect(
      screen.getByLabelText("저장된 앱 설정을 불러오는 중").props
        .accessibilityRole,
    ).toBe("progressbar");
    expect(screen.queryByText("DemoShell mock")).toBeNull();

    hasHydrated = true;
    // 같은 route를 rerender해 loading과 shell이 동시에 존재하지 않는 전환을 확인합니다.
    await rerender(<IndexScreen />);

    expect(
      screen.queryByLabelText("저장된 앱 설정을 불러오는 중"),
    ).toBeNull();
    expect(screen.getByText("DemoShell mock")).toBeTruthy();
  });
});
