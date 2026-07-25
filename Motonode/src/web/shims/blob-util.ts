const ReactNativeBlobUtil = {
  fs: {
    dirs: {
      DocumentDir: '/tmp',
      CacheDir: '/tmp',
      DownloadDir: '/tmp',
    },
  },
  config: (_options: Record<string, unknown>) => ({
    fetch: async (_method: string, url: string) => {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = 'download';
      anchor.click();
      return {
        path: () => objectUrl,
        info: () => ({ status: response.status }),
      };
    },
  }),
  ios: {
    previewDocument: (path: string) => {
      window.open(path, '_blank');
    },
  },
  android: {
    actionViewIntent: async (path: string, _mime?: string) => {
      window.open(path, '_blank');
    },
  },
};

export default ReactNativeBlobUtil;
