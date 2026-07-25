type DocPickerResult = {
  uri: string;
  name: string | null;
  type: string | null;
  size: number | null;
  fileCopyUri: string | null;
};

function pickFile(accept: string): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', () => {
      const file = input.files?.[0] || null;
      document.body.removeChild(input);
      resolve(file);
    });
    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      resolve(null);
    });
    input.click();
  });
}

const DocumentPicker = {
  types: {
    pdf: 'application/pdf',
    images: 'image/*',
    allFiles: '*/*',
  },
  pick: async (options?: { type?: string[] }): Promise<DocPickerResult[]> => {
    const accept = options?.type?.join(',') || '*/*';
    const file = await pickFile(accept);
    if (!file) {
      const err = new Error('User cancelled') as Error & { code?: string };
      err.code = 'DOCUMENT_PICKER_CANCELED';
      throw err;
    }
    return [
      {
        uri: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        size: file.size,
        fileCopyUri: null,
      },
    ];
  },
  isCancel: (err: unknown) =>
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'DOCUMENT_PICKER_CANCELED',
};

export default DocumentPicker;
