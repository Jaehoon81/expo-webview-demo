import { getConstrainedImageSize } from "@/src/utils/image-size";

describe("getConstrainedImageSize", () => {
  it("이미 작은 이미지는 resize하지 않는다", () => {
    expect(getConstrainedImageSize(800, 600)).toEqual({
      width: null,
      height: null,
    });
  });

  it("가로와 세로 이미지의 긴 변만 1000으로 제한한다", () => {
    expect(getConstrainedImageSize(4000, 3000)).toEqual({
      width: 1_000,
      height: null,
    });
    expect(getConstrainedImageSize(2000, 3000)).toEqual({
      width: null,
      height: 1_000,
    });
  });

  it("잘못된 크기를 거부한다", () => {
    expect(() => getConstrainedImageSize(0, 100)).toThrow();
  });
});
