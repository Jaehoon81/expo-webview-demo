// [파일 역할] 사진 권한 요청, 최대 두 장 선택, 크기 제한과 PNG base64 변환을 bridge 결과로 제공합니다.
// [검증 경계] image-size test는 계산만 확인하며 OS picker·권한·실제 image decode/encode는 실기기에서 검증합니다.
import {
  ImageManipulator,
  SaveFormat,
} from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import type { PhotoResult } from "@/src/bridge/types";
import { getConstrainedImageSize } from "@/src/utils/image-size";

const MAX_IMAGE_DIMENSION = 1_000;
const MAX_SELECTION = 2;

async function ensurePhotoPermission(): Promise<void> {
  // 권한은 app 시작이 아니라 사용자가 사진 bridge action을 실행한 시점에만 요청합니다.
  let permission = await ImagePicker.getMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  }

  if (!permission.granted) {
    throw new Error("사진 접근 권한이 거부되었습니다.");
  }
}

export async function selectPhotoImages(): Promise<PhotoResult[]> {
  // [FLOW-05 / 관련 코드] dispatcher가 getPhotoImages를 선택했을 때 이 service Promise의 성공·실패를 공통 envelope로 받습니다.
  await ensurePhotoPermission();

  const selection = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: MAX_SELECTION,
    allowsEditing: false,
    quality: 1,
  });

  if (selection.canceled || !selection.assets?.length) {
    // 취소도 빈 성공 배열로 숨기지 않고 WebView가 사용자에게 알릴 수 있는 Error로 전달합니다.
    throw new Error("사진 선택을 취소했습니다.");
  }

  const results: PhotoResult[] = [];

  for (const [index, asset] of selection.assets
    .slice(0, MAX_SELECTION)
    .entries()) {
    const size = getConstrainedImageSize(
      asset.width,
      asset.height,
      MAX_IMAGE_DIMENSION,
    );
    const context = ImageManipulator.manipulate(asset.uri);

    // 두 image를 순차 처리해 여러 큰 원본의 render/base64 작업이 동시에 memory를 점유하지 않게 합니다.
    if (size.width !== null || size.height !== null) {
      context.resize(size);
    }

    const renderedImage = await context.renderAsync();
    const savedImage = await renderedImage.saveAsync({
      format: SaveFormat.PNG,
      compress: 1,
      base64: true,
    });

    if (!savedImage.base64) {
      // picker 성공과 bridge 성공 사이의 encode 실패도 사진별 불완전 결과 대신 전체 요청 실패로 처리합니다.
      throw new Error("Image 데이터를 생성하지 못했습니다.");
    }

    results.push({
      name: `사진앨범 선택 이미지(${index + 1})`,
      base64Image: savedImage.base64,
    });
  }

  return results;
}
