import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StorageKey } from './keys';

export async function getString(key: StorageKey): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function setString(key: StorageKey, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function getJSON<T>(key: StorageKey): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON<T>(key: StorageKey, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function remove(key: StorageKey): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.clear();
}
