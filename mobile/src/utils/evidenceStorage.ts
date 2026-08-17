import * as FileSystem from 'expo-file-system/legacy';
import { encryptFile } from './evidenceCrypto';

export interface EvidenceItem {
  id: string;
  type: 'photo' | 'video' | 'audio';
  sessionDir: string;
  createdAt: string;
}

export async function listEvidenceSessions(): Promise<EvidenceItem[]> {
  try {
    const docDir = FileSystem.documentDirectory;
    if (!docDir) return [];
    const contents = await FileSystem.readDirectoryAsync(docDir);
    const evidenceDirs = contents.filter((name) => name.startsWith('evidence_'));

    const items: EvidenceItem[] = [];
    for (const dirName of evidenceDirs) {
      const fullDir = `${docDir}${dirName}/`;
      const timestamp = parseInt(dirName.replace('evidence_', ''), 10) || Date.now();
      
      let type: 'photo' | 'video' | 'audio' = 'video';
      
      // Explicitly type the fallback array as string[] to clear the TypeScript error
      const files: string[] = await FileSystem.readDirectoryAsync(fullDir).catch((): string[] => []);
      
      if (files.includes('type_photo.txt')) type = 'photo';
      else if (files.includes('type_audio.txt')) type = 'audio';

      items.push({
        id: dirName,
        type,
        sessionDir: fullDir,
        createdAt: new Date(timestamp).toISOString(),
      });
    }

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function deleteEvidenceSession(sessionDir: string): Promise<void> {
  await FileSystem.deleteAsync(sessionDir, { idempotent: true });
}

export async function saveEvidenceWithType(uri: string, type: 'photo' | 'video' | 'audio'): Promise<string> {
  const sessionDir = await encryptFile(uri);
  const markerPath = `${sessionDir}type_${type}.txt`;
  await FileSystem.writeAsStringAsync(markerPath, type, { encoding: FileSystem.EncodingType.UTF8 }).catch(() => {});
  return sessionDir;
}