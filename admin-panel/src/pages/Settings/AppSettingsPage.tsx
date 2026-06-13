import { HomeMobilePreview } from '@components/AppEffectsPreview/HomeMobilePreview';
import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { Modal } from '@components/Modal/Modal';
import { Select } from '@components/Select';
import {
  DEFAULT_STORE_BANNERS,
  getSettings,
  updateSettings,
  type IStoreBannerItem,
  type IStoreBannersConfig,
  type IVisualEffectsConfig,
  type IRainNoticeConfig,
} from '@services/settingsService';
import { getCategories } from '@services/categoryService';
import { getServiceCategories } from '@services/serviceCategoryService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import {
  buildBannerDestinationOptions,
  buildDestinationKey,
  getDefaultDestination,
  getDestinationSelectOptions,
  resolveDestinationDisplay,
  type IBannerDestinationOption,
} from '@utils/bannerCategoryOptions';
import { extractErrorMessage } from '@utils/errorHandler';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Pencil, Plus, Settings2, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import './AppSettingsPage.css';

const DEFAULT_VISUAL_EFFECTS: IVisualEffectsConfig = {
  enabled: true,
  seasonMode: 'auto',
  manualSeason: 'default',
  backgroundEffect: 'rain',
  overlayEffect: 'none',
  headerColor: null,
  backgroundSpeed: 0.5,
  showOverlayOnHome: true,
  showOverlayOnDealerDashboard: true,
  rainNotice: {
    enabled: true,
    autoShowOnHomeLoad: true,
    autoHideAfterMs: 3500,
    title: "It's raining near this location",
    subtitle: 'Our delivery partners may take longer to reach you',
  },
};

const MAX_BANNERS = 10;

const createBannerId = (): string =>
  `banner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const createEmptyBanner = (
  sortOrder: number,
  defaultDestination?: IBannerDestinationOption,
): IStoreBannerItem => ({
  id: createBannerId(),
  enabled: true,
  sortOrder,
  emoji: '🚗',
  title: 'New Promo Banner',
  subtitle: 'Add a short description',
  cta: 'Learn More',
  backgroundColor: '#1565C0',
  link: defaultDestination?.link ?? {
    type: 'category',
    categoryId: 'all-services',
    categoryType: 'services',
  },
});

const isBannerLinkInvalid = (banner: IStoreBannerItem): boolean =>
  banner.link.type === 'category' && !banner.link.categoryId?.trim();

const repairInvalidBannerLinks = (
  banners: IStoreBannersConfig,
  defaultDestination?: IBannerDestinationOption,
): IStoreBannersConfig => {
  const fallbackLink =
    defaultDestination?.link ?? {
      type: 'category' as const,
      categoryId: 'all-services',
      categoryType: 'services' as const,
    };

  return {
    ...banners,
    items: banners.items.map((item) => {
      if (isBannerLinkInvalid(item)) {
        return { ...item, link: { ...fallbackLink } };
      }
      return item;
    }),
  };
};

const ToggleRow: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => {
  const { theme } = useTheme();

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        cursor: 'pointer',
        padding: '12px 0',
        borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      <div>
        <div style={{ color: theme.colors.text, fontWeight: 600 }}>{label}</div>
        {description && (
          <div style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 }}>
            {description}
          </div>
        )}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 18, height: 18, marginTop: 2 }}
      />
    </label>
  );
};

export const AppSettingsPage: React.FC = () => {
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [visualEffects, setVisualEffects] = useState<IVisualEffectsConfig>(DEFAULT_VISUAL_EFFECTS);
  const [storeBanners, setStoreBanners] = useState<IStoreBannersConfig>(DEFAULT_STORE_BANNERS);
  const [editingBanner, setEditingBanner] = useState<IStoreBannerItem | null>(null);
  const [activePreviewSlide, setActivePreviewSlide] = useState<number | undefined>(undefined);
  const [destinationOptions, setDestinationOptions] = useState<IBannerDestinationOption[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [settings, serviceCategories, productCategories] = await Promise.all([
          getSettings(),
          getServiceCategories().catch(() => ({ sections: [] })),
          getCategories({ status: 'active' }).catch(() => ({ categories: [] })),
        ]);

        const options = buildBannerDestinationOptions(
          serviceCategories.sections,
          productCategories.categories,
        );
        const defaultDestination = getDefaultDestination(options);
        setDestinationOptions(options);
        setVisualEffects(settings.visualEffects ?? DEFAULT_VISUAL_EFFECTS);
        setStoreBanners(
          repairInvalidBannerLinks(
            settings.storeBanners ?? DEFAULT_STORE_BANNERS,
            defaultDestination,
          ),
        );
      } catch (error) {
        showToast(extractErrorMessage(error), 'error');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [showToast]);

  const updateRainNotice = (patch: Partial<IRainNoticeConfig>) => {
    setVisualEffects((prev) => ({
      ...prev,
      rainNotice: { ...prev.rainNotice, ...patch },
    }));
  };

  const sortedBanners = [...storeBanners.items].sort((a, b) => a.sortOrder - b.sortOrder);

  const previewStoreBanners = useMemo<IStoreBannersConfig>(() => {
    if (!editingBanner) {
      return storeBanners;
    }

    return {
      ...storeBanners,
      items: storeBanners.items.map((item) =>
        item.id === editingBanner.id ? editingBanner : item,
      ),
    };
  }, [storeBanners, editingBanner]);

  const normalizeSortOrders = (items: IStoreBannerItem[]): IStoreBannerItem[] =>
    items.map((item, index) => ({ ...item, sortOrder: index }));

  const updateBanners = (items: IStoreBannerItem[]) => {
    setStoreBanners((prev) => ({
      ...prev,
      items: normalizeSortOrders(items),
    }));
  };

  const moveBanner = (id: string, direction: 'up' | 'down') => {
    const index = sortedBanners.findIndex((item) => item.id === id);
    if (index < 0) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedBanners.length) return;

    const next = [...sortedBanners];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    updateBanners(next);
  };

  const toggleBannerEnabled = (id: string, enabled: boolean) => {
    updateBanners(sortedBanners.map((item) => (item.id === id ? { ...item, enabled } : item)));
  };

  const deleteBanner = (id: string) => {
    updateBanners(sortedBanners.filter((item) => item.id !== id));
    if (editingBanner?.id === id) {
      setEditingBanner(null);
    }
  };

  const addBanner = () => {
    if (sortedBanners.length >= MAX_BANNERS) {
      showToast(`Maximum ${MAX_BANNERS} banners allowed`, 'error');
      return;
    }

    const banner = createEmptyBanner(sortedBanners.length, getDefaultDestination(destinationOptions));
    updateBanners([...sortedBanners, banner]);
    setEditingBanner(banner);
    setActivePreviewSlide(sortedBanners.length);
  };

  const applyDestination = (destinationKey: string) => {
    const destination = destinationOptions.find((option) => option.value === destinationKey);
    if (!destination) {
      return;
    }

    setEditingBanner((prev) =>
      prev
        ? {
            ...prev,
            link: { ...destination.link },
          }
        : prev,
    );
  };

  const selectedDestination = editingBanner
    ? resolveDestinationDisplay(destinationOptions, editingBanner.link)
    : undefined;

  const editingDestinationKey = editingBanner
    ? buildDestinationKey(editingBanner.link)
    : '';

  const destinationSelectOptions = useMemo(
    () => getDestinationSelectOptions(destinationOptions, editingBanner?.link),
    [destinationOptions, editingBanner?.link],
  );

  const validateBannerLinks = (items: IStoreBannerItem[]): string | null => {
    for (const banner of items) {
      if (banner.link.type === 'category' && !banner.link.categoryId?.trim()) {
        return `Banner "${banner.title}" needs a destination selected before saving.`;
      }
    }

    return null;
  };

  const saveEditingBanner = () => {
    if (!editingBanner) return;

    if (!editingBanner.title.trim()) {
      showToast('Banner title is required', 'error');
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(editingBanner.backgroundColor)) {
      showToast('Background color must be a hex value like #1565C0', 'error');
      return;
    }

    if (editingBanner.link.type === 'category' && !editingBanner.link.categoryId?.trim()) {
      showToast('Please select a destination for this banner', 'error');
      return;
    }

    updateBanners(
      sortedBanners.map((item) => (item.id === editingBanner.id ? editingBanner : item)),
    );

    const slideIndex = sortedBanners.findIndex((item) => item.id === editingBanner.id);
    setActivePreviewSlide(slideIndex >= 0 ? slideIndex : undefined);
    setEditingBanner(null);
  };

  const handleSave = async () => {
    const linkError = validateBannerLinks(storeBanners.items);
    if (linkError) {
      showToast(linkError, 'error');
      return;
    }

    try {
      setSubmitting(true);
      await updateSettings({ visualEffects, storeBanners });
      showToast('App settings updated successfully', 'success');
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: theme.colors.textSecondary }}>
        Loading app settings...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: 24 }}
    >
      <Breadcrumbs />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Settings2 size={28} color={theme.colors.primary} />
        <div>
          <h1 style={{ margin: 0, color: theme.colors.text, fontSize: 28 }}>App Settings</h1>
          <p style={{ margin: '6px 0 0', color: theme.colors.textSecondary }}>
            Control home screen visual effects and the store promo carousel for all mobile users.
          </p>
        </div>
      </div>

      <div className="app-settings-layout">
        <div style={{ minWidth: 0, maxWidth: 900 }}>
          <Card style={{ marginBottom: 20 }}>
            <h2 style={{ marginTop: 0, color: theme.colors.text }}>Lottie Effects</h2>
            <ToggleRow
              label="Enable visual effects"
              description="Master switch for background and overlay Lottie animations."
              checked={visualEffects.enabled}
              onChange={(checked) => setVisualEffects((prev) => ({ ...prev, enabled: checked }))}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              <Select
                label="Background effect"
                value={visualEffects.backgroundEffect}
                onChange={(value) =>
                  setVisualEffects((prev) => ({
                    ...prev,
                    backgroundEffect: value as IVisualEffectsConfig['backgroundEffect'],
                  }))
                }
                options={[
                  { value: 'rain', label: 'Rain' },
                  { value: 'snow', label: 'Snow' },
                  { value: 'sakura', label: 'Sakura' },
                  { value: 'none', label: 'None' },
                ]}
              />
              <Select
                label="Overlay effect"
                value={visualEffects.overlayEffect}
                onChange={(value) =>
                  setVisualEffects((prev) => ({
                    ...prev,
                    overlayEffect: value as IVisualEffectsConfig['overlayEffect'],
                  }))
                }
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'winter_train', label: 'Winter Train' },
                  { value: 'christmas_sleigh', label: 'Christmas Sleigh' },
                ]}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              <Select
                label="Season mode"
                value={visualEffects.seasonMode}
                onChange={(value) =>
                  setVisualEffects((prev) => ({
                    ...prev,
                    seasonMode: value as IVisualEffectsConfig['seasonMode'],
                  }))
                }
                options={[
                  { value: 'auto', label: 'Auto (calendar month)' },
                  { value: 'manual', label: 'Manual' },
                ]}
              />
              <Select
                label="Manual season"
                value={visualEffects.manualSeason}
                onChange={(value) =>
                  setVisualEffects((prev) => ({
                    ...prev,
                    manualSeason: value as IVisualEffectsConfig['manualSeason'],
                  }))
                }
                disabled={visualEffects.seasonMode !== 'manual'}
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'winter', label: 'Winter' },
                  { value: 'spring', label: 'Spring' },
                  { value: 'summer', label: 'Summer' },
                  { value: 'autumn', label: 'Autumn' },
                ]}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              <Input
                label="Header color override"
                placeholder="#f7ca49 or leave empty for season default"
                value={visualEffects.headerColor ?? ''}
                onChange={(value) =>
                  setVisualEffects((prev) => ({
                    ...prev,
                    headerColor: value.trim() || null,
                  }))
                }
              />
              <Input
                label="Background animation speed"
                type="number"
                value={String(visualEffects.backgroundSpeed)}
                onChange={(value) =>
                  setVisualEffects((prev) => ({
                    ...prev,
                    backgroundSpeed: Number(value) || 0.5,
                  }))
                }
              />
            </div>

            <ToggleRow
              label="Show overlay on home screen"
              checked={visualEffects.showOverlayOnHome}
              onChange={(checked) =>
                setVisualEffects((prev) => ({ ...prev, showOverlayOnHome: checked }))
              }
            />
            <ToggleRow
              label="Show overlay on dealer dashboard"
              checked={visualEffects.showOverlayOnDealerDashboard}
              onChange={(checked) =>
                setVisualEffects((prev) => ({ ...prev, showOverlayOnDealerDashboard: checked }))
              }
            />
          </Card>

          <Card style={{ marginBottom: 20 }}>
            <h2 style={{ marginTop: 0, color: theme.colors.text }}>Rain Notice Banner</h2>
            <ToggleRow
              label="Enable rain notice banner"
              description="Shows the sliding delivery notice at the top of the home screen."
              checked={visualEffects.rainNotice.enabled}
              onChange={(checked) => updateRainNotice({ enabled: checked })}
            />
            <ToggleRow
              label="Auto-show on home load"
              checked={visualEffects.rainNotice.autoShowOnHomeLoad}
              onChange={(checked) => updateRainNotice({ autoShowOnHomeLoad: checked })}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              <Input
                label="Auto-hide delay (ms)"
                type="number"
                value={String(visualEffects.rainNotice.autoHideAfterMs)}
                onChange={(value) => updateRainNotice({ autoHideAfterMs: Number(value) || 0 })}
              />
              <Input
                label="Notice title"
                value={visualEffects.rainNotice.title}
                onChange={(value) => updateRainNotice({ title: value })}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <Input
                label="Notice subtitle"
                value={visualEffects.rainNotice.subtitle}
                onChange={(value) => updateRainNotice({ subtitle: value })}
              />
            </div>
          </Card>

          <Card style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 8,
              }}
            >
              <h2 style={{ margin: 0, color: theme.colors.text }}>Promo Carousel</h2>
              <Button onClick={addBanner} disabled={sortedBanners.length >= MAX_BANNERS}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={16} />
                  Add Banner
                </span>
              </Button>
            </div>

            <ToggleRow
              label="Enable promo carousel"
              description="Shows the horizontal banner strip between category sections on the store home."
              checked={storeBanners.enabled}
              onChange={(checked) =>
                setStoreBanners((prev) => ({ ...prev, enabled: checked }))
              }
            />

            <div style={{ marginTop: 16, maxWidth: 280 }}>
              <Input
                label="Auto-scroll interval (ms)"
                type="number"
                value={String(storeBanners.autoScrollMs)}
                onChange={(value) =>
                  setStoreBanners((prev) => ({
                    ...prev,
                    autoScrollMs: Math.max(0, Number(value) || 3500),
                  }))
                }
              />
            </div>

            <div className="app-settings-banner-list">
              {sortedBanners.length === 0 && (
                <p style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                  No banners yet. Add one to show the carousel on the store home.
                </p>
              )}

              {sortedBanners.map((banner, index) => (
                <div key={banner.id} className="app-settings-banner-row">
                  <div className="app-settings-banner-preview-swatch" style={{ backgroundColor: banner.backgroundColor }}>
                    <span>{banner.emoji}</span>
                  </div>

                  <div className="app-settings-banner-meta">
                    <div style={{ fontWeight: 600, color: theme.colors.text }}>{banner.title}</div>
                    <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                      {banner.enabled ? 'Enabled' : 'Disabled'} · {banner.cta} ·{' '}
                      {resolveDestinationDisplay(destinationOptions, banner.link).label}
                    </div>
                    {isBannerLinkInvalid(banner) && (
                      <span className="app-settings-banner-warning">Needs destination</span>
                    )}
                  </div>

                  <label className="app-settings-banner-toggle">
                    <input
                      type="checkbox"
                      checked={banner.enabled}
                      onChange={(e) => toggleBannerEnabled(banner.id, e.target.checked)}
                    />
                  </label>

                  <div className="app-settings-banner-actions">
                    <button
                      type="button"
                      className="app-settings-icon-btn"
                      onClick={() => moveBanner(banner.id, 'up')}
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      className="app-settings-icon-btn"
                      onClick={() => moveBanner(banner.id, 'down')}
                      disabled={index === sortedBanners.length - 1}
                      aria-label="Move down"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      className="app-settings-icon-btn"
                      onClick={() => {
                        setEditingBanner(banner);
                        setActivePreviewSlide(index);
                      }}
                      aria-label="Edit banner"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="app-settings-icon-btn danger"
                      onClick={() => deleteBanner(banner.id)}
                      aria-label="Delete banner"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Button onClick={handleSave} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save App Settings'}
          </Button>
        </div>

        <HomeMobilePreview
          visualEffects={visualEffects}
          storeBanners={previewStoreBanners}
          activePreviewSlide={activePreviewSlide}
        />
      </div>

      <Modal
        isOpen={!!editingBanner}
        onClose={() => setEditingBanner(null)}
        title="Edit Promo Banner"
        size="lg"
      >
        {editingBanner && (
          <div className="app-settings-banner-form">
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
              <Input
                label="Emoji"
                value={editingBanner.emoji}
                onChange={(value) =>
                  setEditingBanner((prev) => (prev ? { ...prev, emoji: value } : prev))
                }
              />
              <Input
                label="Title"
                value={editingBanner.title}
                onChange={(value) =>
                  setEditingBanner((prev) => (prev ? { ...prev, title: value } : prev))
                }
              />
            </div>

            <Input
              label="Subtitle"
              value={editingBanner.subtitle}
              onChange={(value) =>
                setEditingBanner((prev) => (prev ? { ...prev, subtitle: value } : prev))
              }
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input
                label="CTA label"
                value={editingBanner.cta}
                onChange={(value) =>
                  setEditingBanner((prev) => (prev ? { ...prev, cta: value } : prev))
                }
              />
              <Input
                label="Background color"
                placeholder="#1565C0"
                value={editingBanner.backgroundColor}
                onChange={(value) =>
                  setEditingBanner((prev) =>
                    prev ? { ...prev, backgroundColor: value.trim() } : prev,
                  )
                }
              />
            </div>

            <Select
              label="Link type"
              value={editingBanner.link.type}
              onChange={(value) =>
                setEditingBanner((prev) =>
                  prev
                    ? {
                        ...prev,
                        link: {
                          ...prev.link,
                          type: value as IStoreBannerItem['link']['type'],
                        },
                      }
                    : prev,
                )
              }
              options={[
                { value: 'category', label: 'Category navigation' },
                { value: 'none', label: 'No action' },
              ]}
            />

            {editingBanner.link.type === 'category' && (
              <div>
                <Select
                  label="Destination"
                  searchable
                  placeholder="Search categories and services..."
                  value={editingDestinationKey}
                  onChange={applyDestination}
                  options={destinationSelectOptions}
                />
                {selectedDestination ? (
                  <p
                    style={{
                      margin: '8px 0 0',
                      fontSize: 13,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Tapping this banner opens <strong>{selectedDestination.label}</strong> (
                    {selectedDestination.hint}).
                  </p>
                ) : (
                  <p
                    style={{
                      margin: '8px 0 0',
                      fontSize: 13,
                      color: theme.colors.error ?? '#dc2626',
                    }}
                  >
                    Select where users should land when they tap this banner.
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <Button onClick={() => setEditingBanner(null)}>Cancel</Button>
              <Button onClick={saveEditingBanner}>Save Banner</Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default AppSettingsPage;
