/**
 * Load Feather icon font + Inter text fonts used by Motonode on web.
 * Component styles reference Inter_* family names from Expo/RN — alias them here.
 */
import inter400 from '@fontsource/inter/files/inter-latin-400-normal.woff2';
import inter500 from '@fontsource/inter/files/inter-latin-500-normal.woff2';
import inter600 from '@fontsource/inter/files/inter-latin-600-normal.woff2';
import inter700 from '@fontsource/inter/files/inter-latin-700-normal.woff2';

function aliasFontFace(family: string, url: string, weight: number): string {
  return `
    @font-face {
      font-family: '${family}';
      src: url(${url}) format('woff2');
      font-weight: ${weight};
      font-style: normal;
      font-display: swap;
    }
  `;
}

export function loadWebFonts(): void {
  try {
    const style = document.createElement('style');
    style.textContent = [
      aliasFontFace('Inter_400Regular', inter400, 400),
      aliasFontFace('Inter_500Medium', inter500, 500),
      aliasFontFace('Inter_600SemiBold', inter600, 600),
      aliasFontFace('Inter_700Bold', inter700, 700),
      // Generic Inter for non-RN DOM text
      aliasFontFace('Inter', inter400, 400),
      aliasFontFace('Inter', inter500, 500),
      aliasFontFace('Inter', inter600, 600),
      aliasFontFace('Inter', inter700, 700),
    ].join('\n');
    document.head.appendChild(style);
  } catch (error) {
    console.warn('[Web] Failed to load Inter fonts:', error);
  }
}

export function loadWebIconFonts(): void {
  try {
    // Vite resolves this to a URL; inject @font-face once.
    const featherUrl = new URL(
      '../../node_modules/react-native-vector-icons/Fonts/Feather.ttf',
      import.meta.url,
    ).href;

    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        src: url(${featherUrl});
        font-family: Feather;
        font-weight: normal;
        font-style: normal;
      }
    `;
    document.head.appendChild(style);
  } catch (error) {
    console.warn('[Web] Failed to load Feather icon font:', error);
  }
}
