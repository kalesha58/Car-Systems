/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_NAME?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_SITE_DESCRIPTION?: string;
  readonly VITE_SITE_KEYWORDS?: string;
  readonly VITE_OG_IMAGE?: string;
  readonly VITE_TWITTER_HANDLE?: string;
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string;
  readonly VITE_MICROSOFT_CLARITY_ID?: string;
  readonly VITE_GOOGLE_ANALYTICS_ID?: string;
  readonly VITE_GTM_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
