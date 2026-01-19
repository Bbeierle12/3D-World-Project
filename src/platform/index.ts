export interface PlatformAdapter {
  isNative: boolean;
  saveTextFile: (filename: string, contents: string) => void;
  saveBlob: (filename: string, blob: Blob) => void;
}

const saveBlobWeb = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const webAdapter: PlatformAdapter = {
  isNative: false,
  saveTextFile: (filename, contents) => {
    saveBlobWeb(filename, new Blob([contents], { type: 'text/plain' }));
  },
  saveBlob: saveBlobWeb
};

export const platform: PlatformAdapter = webAdapter;

export default platform;
