import { useAppConfigStore } from '@state/appConfigStore';
import {
  DEFAULT_VISUAL_EFFECTS,
  IVisualEffectsConfig,
  IRainNoticeConfig,
} from '@types/visualEffects';
import { resolveVisualTheme, ISeasonalTheme } from '@config/seasonalThemes';

/** Backward-compatible wrapper around unified app config store. */
interface IVisualEffectsStoreView {
  config: IVisualEffectsConfig;
  isLoading: boolean;
  isHydrated: boolean;
  fetchVisualEffects: (forceRefresh?: boolean) => Promise<void>;
  getResolvedTheme: () => ISeasonalTheme;
  getRainNoticeConfig: () => IRainNoticeConfig;
}

const mapState = (state: ReturnType<typeof useAppConfigStore.getState>): IVisualEffectsStoreView => ({
  config: state.visualEffects,
  isLoading: state.isLoading,
  isHydrated: state.isHydrated,
  fetchVisualEffects: state.fetchAppConfig,
  getResolvedTheme: state.getResolvedTheme,
  getRainNoticeConfig: state.getRainNoticeConfig,
});

export const useVisualEffectsStore = <T,>(
  selector: (state: IVisualEffectsStoreView) => T,
): T => useAppConfigStore((state) => selector(mapState(state)));

export { DEFAULT_VISUAL_EFFECTS };
