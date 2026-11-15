import type { LifeOSState } from './types';

export interface BackupEnvelope {
  format: 'life_os_backup_v1';
  createdAt: string;
  encrypted: boolean;
  sha256: string;
  payload: string; // JSON string or base64(salt + iv + ciphertext)
}

async function computeSha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function createBackupEnvelope(
  state: LifeOSState,
  passphrase?: string,
): Promise<BackupEnvelope> {
  const plainJson = JSON.stringify(state);
  const sha256 = await computeSha256Hex(plainJson);

  if (passphrase && passphrase.trim().length > 0) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveAesKey(passphrase, salt);
    const cipherBuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(plainJson),
    );
    const cipherBytes = new Uint8Array(cipherBuf);
    const combined = new Uint8Array(salt.length + iv.length + cipherBytes.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(cipherBytes, salt.length + iv.length);
    return {
      format: 'life_os_backup_v1',
      createdAt: new Date().toISOString(),
      encrypted: true,
      sha256,
      payload: bytesToBase64(combined),
    };
  }

  return {
    format: 'life_os_backup_v1',
    createdAt: new Date().toISOString(),
    encrypted: false,
    sha256,
    payload: plainJson,
  };
}

export async function restoreBackupEnvelope(
  envelopeJson: string,
  passphrase?: string,
): Promise<{ state: LifeOSState; integrityVerified: boolean }> {
  const parsed = JSON.parse(envelopeJson) as BackupEnvelope;
  if (parsed.format !== 'life_os_backup_v1' || typeof parsed.payload !== 'string') {
    throw new Error('Невірний формат файлу резервної копії.');
  }

  let plainJson = parsed.payload;
  if (parsed.encrypted) {
    if (!passphrase || passphrase.trim().length === 0) {
      throw new Error('Ця резервна копія зашифрована. Введіть пароль для відновлення.');
    }
    const combined = base64ToBytes(parsed.payload);
    if (combined.length < 29) {
      throw new Error('Пошкоджені зашифровані дані.');
    }
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const cipher = combined.slice(28);
    const key = await deriveAesKey(passphrase, salt);
    let plainBuf: ArrayBuffer;
    try {
      plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    } catch {
      throw new Error('Невірний пароль або файл резервної копії пошкоджено.');
    }
    plainJson = new TextDecoder().decode(plainBuf);
  }

  const actualHash = await computeSha256Hex(plainJson);
  const integrityVerified = actualHash === parsed.sha256;
  if (!integrityVerified) {
    throw new Error('Перевірка цілісності (SHA-256) не пройдена. Файл пошкоджено.');
  }

  const state = JSON.parse(plainJson) as LifeOSState;
  return { state, integrityVerified };
}
