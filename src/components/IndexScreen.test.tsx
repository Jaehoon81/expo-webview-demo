// [파일 역할] 저장된 상태를 아직 읽는 중에는 loading을 보여 주고, 다 읽은 뒤에만 DemoShell을 만드는지 확인합니다.
// [검증 경계] Zustand 저장 기능과 DemoShell을 가짜로 바꿉니다.
// 실제 SecureStore 복원, Root Stack, 앱을 처음 여는 deep link는 확인하지 않습니다.
// [라이브러리] React Native Testing Library의 `rerender`는 같은 route 화면을 유지한 채 저장소 읽기 완료 값만 바꿔 다시 그립니다.

// ========================================== 외부 의존성 ==========================================

import { render, screen } from "@testing-library/react-native";

import IndexScreen from "@/app/index";
import { useAppStore } from "@/src/store/app-store";

// =================================================================================================

// ====================================== test mock과 helper =======================================

// [라이브러리] `jest.mock`은 실제 DemoShell 대신 짧은 Text를 보여 주는 가짜 component를 만듭니다.
// DemoShell이 만들어졌는지만 쉽게 확인할 수 있습니다.
// [역할] 첫 mock factory callback은 실제 DemoShell 대신 확인용 Text component를 내보냅니다.
jest.mock("@/src/components/DemoShell", () => {
  // `requireActual`은 React Native 전체를 가짜로 바꾸지 않고 실제 `Text` component를 가져옵니다.
  const { Text } = jest.requireActual("react-native");

  return {
    // [역할] `DemoShell` mock component는 hydration 뒤 mount 여부를 글자로 확인할 수 있게 합니다.
    DemoShell: () => <Text>DemoShell mock</Text>,
  };
});

// [역할] 둘째 mock factory callback은 test가 결과를 정할 수 있는 가짜 Zustand Hook을 내보냅니다.
jest.mock("@/src/store/app-store", () => ({
  // test가 hasHydrated 값만 직접 바꿀 수 있도록 만든 가짜 Zustand Hook입니다.
  useAppStore: jest.fn(),
}));

// [문법] import한 Hook을 Jest mock으로 다루기 위해 test 안에서만 `unknown`을 거쳐 type을 두 번 바꿉니다.
// 실제 앱의 type에는 영향을 주지 않습니다.
const mockedUseAppStore = useAppStore as unknown as jest.Mock;

// =================================================================================================

// ========================================== test cases ===========================================

// [역할] `describe` callback은 hydration 전후의 index 화면 전환을 확인하는 test 묶음을 실행합니다.
describe("IndexScreen hydration gate", () => {
  // [역할] `beforeEach` callback은 각 test 전에 이전 Zustand mock 동작과 호출 기록을 지웁니다.
  beforeEach(() => {
    // [라이브러리] 이전 test에서 정한 가짜 동작과 호출 기록을 지웁니다. 각 test를 같은 초기 상태에서 시작합니다.
    jest.clearAllMocks();
  });

  // [역할] 이 test callback은 loading 화면이 먼저 보이고 hydration 뒤에만 DemoShell이 mount되는지 확인합니다.
  it("hydration 전에는 로딩 화면을 유지하고 완료 후 DemoShell을 mount한다", async () => {
    // [문법] 가짜 selector가 바깥의 boolean 값을 읽습니다. 값을 바꾼 뒤 같은 component를 다시 그려 읽기 전과 읽기 후를 나타냅니다.
    let hasHydrated = false;
    mockedUseAppStore.mockImplementation(
      // [역할] mock selector callback은 test가 바꾸는 `hasHydrated` 값을 실제 Zustand selector 모양으로 전달합니다.
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
    // 같은 route를 `rerender`하여 loading이 사라진 뒤 DemoShell만 나타나는지 확인합니다. 두 화면이 동시에 보여서는 안 됩니다.
    await rerender(<IndexScreen />);

    expect(
      screen.queryByLabelText("저장된 앱 설정을 불러오는 중"),
    ).toBeNull();
    expect(screen.getByText("DemoShell mock")).toBeTruthy();
  });
});

// =================================================================================================
