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
    await rerender(<IndexScreen />);

    expect(
      screen.queryByLabelText("저장된 앱 설정을 불러오는 중"),
    ).toBeNull();
    expect(screen.getByText("DemoShell mock")).toBeTruthy();
  });
});
