export type Asset = {
  uri?: string;
  fileName?: string;
  type?: string;
  fileSize?: number;
  width?: number;
  height?: number;
};

export type ImagePickerResponse = {
  didCancel?: boolean;
  errorCode?: string;
  errorMessage?: string;
  assets?: Asset[];
};

type Options = {
  mediaType?: 'photo' | 'video' | 'mixed';
  selectionLimit?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  includeBase64?: boolean;
};

function pickFiles(accept: string, multiple: boolean): Promise<File[]> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', () => {
      const files = Array.from(input.files || []);
      document.body.removeChild(input);
      resolve(files);
    });
    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      resolve([]);
    });
    input.click();
  });
}

async function filesToResponse(files: File[]): Promise<ImagePickerResponse> {
  if (!files.length) {
    return { didCancel: true };
  }
  const assets: Asset[] = await Promise.all(
    files.map(async file => ({
      uri: URL.createObjectURL(file),
      fileName: file.name,
      type: file.type,
      fileSize: file.size,
    })),
  );
  return { assets };
}

export async function launchImageLibrary(
  options: Options = {},
  callback?: (response: ImagePickerResponse) => void,
): Promise<ImagePickerResponse> {
  const files = await pickFiles('image/*', (options.selectionLimit ?? 1) > 1);
  const response = await filesToResponse(files.slice(0, options.selectionLimit ?? 1));
  callback?.(response);
  return response;
}

export async function launchCamera(
  options: Options = {},
  callback?: (response: ImagePickerResponse) => void,
): Promise<ImagePickerResponse> {
  // Prefer camera capture attribute when supported; falls back to file picker.
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.setAttribute('capture', 'environment');
  input.style.display = 'none';

  const response = await new Promise<ImagePickerResponse>(resolve => {
    document.body.appendChild(input);
    input.addEventListener('change', async () => {
      const files = Array.from(input.files || []);
      document.body.removeChild(input);
      resolve(await filesToResponse(files.slice(0, options.selectionLimit ?? 1)));
    });
    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      resolve({ didCancel: true });
    });
    input.click();
  });

  callback?.(response);
  return response;
}

export default { launchCamera, launchImageLibrary };
