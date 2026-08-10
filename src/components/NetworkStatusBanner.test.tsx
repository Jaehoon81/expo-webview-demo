import { render, screen } from "@testing-library/react-native";

import { NetworkStatusBanner } from "@/src/components/NetworkStatusBanner";

describe("NetworkStatusBanner", () => {
  it("오프라인일 때만 지속형 안내를 표시한다", async () => {
    const { rerender } = await render(
      <NetworkStatusBanner visible={false} />,
    );

    expect(
      screen.queryByText("네트워크에 연결되어 있지 않습니다."),
    ).toBeNull();

    await rerender(<NetworkStatusBanner visible />);

    expect(screen.getByRole("alert")).toBeOnTheScreen();
    expect(
      screen.getByText("네트워크에 연결되어 있지 않습니다."),
    ).toBeOnTheScreen();
  });
});
