import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export type AttachedFile = {
  name: string;
  type: string;
  content: string; // base64 or text
  size: number;
};

const TEXT_TYPES = [
  'text/', 'application/json', 'application/xml',
  'application/javascript', 'application/typescript',
  'application/x-python', 'application/x-sh',
];

function isTextFile(mimeType: string): boolean {
  return TEXT_TYPES.some((t) => mimeType.startsWith(t));
}

export async function pickFile(): Promise<AttachedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? 'application/octet-stream';

  let content = '';
  if (isTextFile(mimeType)) {
    content = await FileSystem.readAsStringAsync(asset.uri);
  } else {
    content = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  return {
    name: asset.name,
    type: mimeType,
    content,
    size: asset.size ?? 0,
  };
}

export function formatFileForPrompt(file: AttachedFile): string {
  if (isTextFile(file.type)) {
    return `\n\n[File: ${file.name}]\n\`\`\`\n${file.content}\n\`\`\``;
  }
  return `\n\n[File attached: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB) - binary file]`;
}
