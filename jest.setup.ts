// [파일 역할] 모든 Jest suite보다 먼저 SecureStore native module을 성공하는 비동기 memory 대역으로 바꿉니다.
// [검증 경계] 이 mock은 JS test 실행을 위한 공통 기반이며 실제 keychain/keystore 보안·영속성 성공의 증거가 아닙니다.
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
