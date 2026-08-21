import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer: unknown[];
    clarity?: (...args: unknown[]) => void;
  }
}

const appendScript = (id: string, src?: string, content?: string, isAsync = false) => {
  if (document.getElementById(id)) {
    return;
  }

  const script = document.createElement("script");
  script.id = id;

  if (src) {
    script.src = src;
  }

  if (isAsync) {
    script.async = true;
  }

  if (content) {
    script.text = content;
  }

  document.head.appendChild(script);
};

export function AnalyticsScripts() {
  const gtmId = import.meta.env.VITE_GTM_ID?.trim();
  const gaId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID?.trim();
  const clarityId = import.meta.env.VITE_MICROSOFT_CLARITY_ID?.trim();

  useEffect(() => {
    if (gtmId) {
      appendScript(
        "gtm-script",
        undefined,
        `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
      );
    }

    if (gaId) {
      appendScript(
        "ga-loader",
        `https://www.googletagmanager.com/gtag/js?id=${gaId}`,
        undefined,
        true,
      );
      appendScript(
        "ga-script",
        undefined,
        `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`,
      );
    }

    if (clarityId) {
      appendScript(
        "clarity-script",
        undefined,
        `(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${clarityId}");`,
      );
    }
  }, [clarityId, gaId, gtmId]);

  if (!gtmId) {
    return null;
  }

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
