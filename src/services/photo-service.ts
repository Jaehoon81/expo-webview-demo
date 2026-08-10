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
  let permission = await ImagePicker.getMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  }

  if (!permission.granted) {
    throw new Error("사진 접근 권한이 거부되었습니다.");
  }
}

export async function selectPhotoImages(): Promise<PhotoResult[]> {
  await ensurePhotoPermission();

  const selection = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: MAX_SELECTION,
    allowsEditing: false,
    quality: 1,
  });

  if (selection.canceled || !selection.assets?.length) {
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
      throw new Error("Image 데이터를 생성하지 못했습니다.");
    }

    results.push({
      name: `사진앨범 선택 이미지(${index + 1})`,
      base64Image: savedImage.base64,
    });
  }

  return results;
}
