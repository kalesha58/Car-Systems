import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

type WebViewProps = {
  source?: { uri?: string; html?: string };
  style?: StyleProp<ViewStyle>;
  onLoadEnd?: () => void;
  onError?: () => void;
  startInLoadingState?: boolean;
};

/**
 * WebView → iframe on web.
 */
export const WebView = React.forwardRef(function WebView(
  { source, style, onLoadEnd, onError }: WebViewProps,
  _ref,
) {
  const uri = source?.uri;
  const flat = (style || {}) as ViewStyle;

  if (!uri && source?.html) {
    return (
      <View style={style}>
        <iframe
          title="webview"
          srcDoc={source.html}
          style={{ border: 'none', width: '100%', height: '100%', ...(flat as object) }}
          onLoad={() => onLoadEnd?.()}
        />
      </View>
    );
  }

  return (
    <View style={style}>
      <iframe
        title="webview"
        src={uri}
        style={{ border: 'none', width: '100%', height: '100%', minHeight: 400 }}
        onLoad={() => onLoadEnd?.()}
        onError={() => onError?.()}
      />
    </View>
  );
});

export default WebView;
