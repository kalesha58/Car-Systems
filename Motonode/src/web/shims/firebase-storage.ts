import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
  uploadString,
} from 'firebase/storage';

import { getFirebaseApp } from '../firebase/init';

function wrapRef(storageRef: ReturnType<typeof ref>) {
  return {
    fullPath: storageRef.fullPath,
    putFile: async (path: string, metadata?: { contentType?: string }) => {
      const response = await fetch(path);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob, metadata);
      return { ref: wrapRef(storageRef) };
    },
    put: async (data: Blob | Uint8Array | ArrayBuffer, metadata?: { contentType?: string }) => {
      await uploadBytes(storageRef, data, metadata);
      return { ref: wrapRef(storageRef) };
    },
    putString: async (
      data: string,
      format: 'raw' | 'base64' | 'base64url' | 'data_url' = 'raw',
      metadata?: { contentType?: string },
    ) => {
      await uploadString(storageRef, data, format === 'data_url' ? 'data_url' : format, metadata);
      return { ref: wrapRef(storageRef) };
    },
    getDownloadURL: () => getDownloadURL(storageRef),
  };
}

function storage() {
  const instance = getStorage(getFirebaseApp());
  return {
    ref: (path?: string) => wrapRef(path ? ref(instance, path) : ref(instance)),
  };
}

export default storage;
