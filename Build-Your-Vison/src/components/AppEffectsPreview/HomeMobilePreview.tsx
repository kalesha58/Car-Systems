import type { IStoreBannerItem, IStoreBannersConfig, IVisualEffectsConfig } from '@services/settingsService';
import {
  getAnimationDuration,
  resolvePreviewHeaderColor,
  shouldShowBackgroundEffect,
  shouldShowOverlayEffect,
} from '@utils/visualEffectsPreview';
import {
  getEnabledStoreBanners,
  resolveBannerAutoScrollMs,
  shouldShowStoreBanners,
} from '@utils/storeBannersPreview';
import { Battery, Signal, Wifi } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import '../AppEffectsPreview/AppEffectsMobilePreview.css';
import './HomeMobilePreview.css';

interface IHomeMobilePreviewProps {
  visualEffects: IVisualEffectsConfig;
  storeBanners: IStoreBannersConfig;
  activePreviewSlide?: number;
}

const PARTICLE_COUNT = 18;

const BackgroundParticles: React.FC<{
  effect: 'rain' | 'snow' | 'sakura';
  speed: number;
}> = ({ effect, speed }) => {
  const duration = getAnimationDuration(speed);
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 4) % 100}%`,
        delay: `${(i * 0.13) % 1.2}s`,
        size: effect === 'snow' ? 3 + (i % 3) : effect === 'sakura' ? 6 + (i % 4) : 2,
      })),
    [effect],
  );

  return (
    <div className={`mobile-preview-particles mobile-preview-particles--${effect}`}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="mobile-preview-particle"
          style={{
            left: p.left,
            animationDuration: duration,
            animationDelay: p.delay,
            width: effect === 'rain' ? 2 : p.size,
            height: effect === 'rain' ? 10 + (p.id % 4) * 3 : p.size,
          }}
        />
      ))}
    </div>
  );
};

const PromoCarouselPreview: React.FC<{
  banners: IStoreBannerItem[];
  autoScrollMs: number;
  activePreviewSlide?: number;
}> = ({ banners, autoScrollMs, activePreviewSlide }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activePreviewSlide !== undefined) {
      setActiveIndex(Math.min(activePreviewSlide, Math.max(banners.length - 1, 0)));
    }
  }, [activePreviewSlide, banners.length]);

  useEffect(() => {
    if (banners.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, autoScrollMs);

    return () => clearInterval(timer);
  }, [autoScrollMs, banners.length]);

  if (banners.length === 0) {
    return null;
  }

  const banner = banners[activeIndex] ?? banners[0];

  return (
    <div className="mobile-preview-carousel">
      <div
        className="mobile-preview-carousel-card"
        style={{ backgroundColor: banner.backgroundColor }}
      >
        <div className="mobile-preview-carousel-emoji">{banner.emoji}</div>
        <div className="mobile-preview-carousel-text">
          <p className="mobile-preview-carousel-title">{banner.title}</p>
          <p className="mobile-preview-carousel-subtitle">{banner.subtitle}</p>
          <span className="mobile-preview-carousel-cta">{banner.cta} →</span>
        </div>
      </div>
      <div className="mobile-preview-carousel-dots">
        {banners.map((item, index) => (
          <span
            key={item.id}
            className={`mobile-preview-carousel-dot${index === activeIndex ? ' active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

export const HomeMobilePreview: React.FC<IHomeMobilePreviewProps> = ({
  visualEffects,
  storeBanners,
  activePreviewSlide,
}) => {
  const headerColor = resolvePreviewHeaderColor(visualEffects);
  const backgroundEffect = shouldShowBackgroundEffect(visualEffects);
  const overlayEffect = shouldShowOverlayEffect(visualEffects);
  const showNotice = visualEffects.rainNotice.enabled;
  const enabledBanners = getEnabledStoreBanners(storeBanners);
  const showCarousel = shouldShowStoreBanners(storeBanners);
  const autoScrollMs = resolveBannerAutoScrollMs(storeBanners);

  return (
    <div className="mobile-preview-shell">
      <p className="mobile-preview-label">Live mobile preview</p>
      <p className="mobile-preview-sublabel">Updates instantly as you change settings</p>

      <div className="mobile-preview-device">
        <div className="mobile-preview-notch" />
        <div className="mobile-preview-screen">
          <div className="mobile-preview-status-bar">
            <span>9:41</span>
            <div className="mobile-preview-status-icons">
              <Signal size={12} />
              <Wifi size={12} />
              <Battery size={12} />
            </div>
          </div>

          {showNotice && (
            <div className="mobile-preview-notice">
              <p className="mobile-preview-notice-title">{visualEffects.rainNotice.title}</p>
              <p className="mobile-preview-notice-subtitle">{visualEffects.rainNotice.subtitle}</p>
            </div>
          )}

          <div className="mobile-preview-hero" style={{ backgroundColor: headerColor }}>
            {backgroundEffect && backgroundEffect !== 'none' && (
              <BackgroundParticles
                effect={backgroundEffect as 'rain' | 'snow' | 'sakura'}
                speed={visualEffects.backgroundSpeed}
              />
            )}

            <div className="mobile-preview-hero-content">
              <p className="mobile-preview-delivery-label">Delivery in</p>
              <div className="mobile-preview-delivery-row">
                <span className="mobile-preview-delivery-time">15 minutes</span>
                {showNotice && <span className="mobile-preview-rain-chip">⛈️ Rain</span>}
              </div>
              <p className="mobile-preview-address">Knowhere, Somewhere 😅</p>
            </div>

            {overlayEffect && (
              <div className="mobile-preview-overlay">
                <span className="mobile-preview-overlay-icon">
                  {overlayEffect === 'winter_train' ? '🚂' : '🛷'}
                </span>
                <span className="mobile-preview-overlay-text">
                  {overlayEffect === 'winter_train' ? 'Winter Train' : 'Christmas Sleigh'}
                </span>
              </div>
            )}
          </div>

          <div className="mobile-preview-body mobile-preview-body--scrollable">
            <div className="mobile-preview-search">Search products, services...</div>
            <div className="mobile-preview-chips">
              <span>Parts</span>
              <span>Services</span>
              <span>Vehicles</span>
            </div>
            <div className="mobile-preview-cards">
              <div className="mobile-preview-card" />
              <div className="mobile-preview-card" />
            </div>

            {showCarousel && (
              <PromoCarouselPreview
                banners={enabledBanners}
                autoScrollMs={autoScrollMs}
                activePreviewSlide={activePreviewSlide}
              />
            )}

            <div className="mobile-preview-cards">
              <div className="mobile-preview-card" />
              <div className="mobile-preview-card" />
            </div>
          </div>

          <div className="mobile-preview-tab-bar">
            <span className="active">Home</span>
            <span>Play</span>
            <span>Category</span>
            <span>Cart</span>
            <span>Profile</span>
          </div>
        </div>
      </div>

      <div className="mobile-preview-legend">
        <span>
          <strong>Header:</strong> {headerColor}
        </span>
        <span>
          <strong>Background:</strong>{' '}
          {!visualEffects.enabled || !backgroundEffect ? 'Off' : backgroundEffect}
        </span>
        <span>
          <strong>Overlay:</strong>{' '}
          {!overlayEffect ? 'Off' : overlayEffect.replace('_', ' ')}
        </span>
        <span>
          <strong>Carousel:</strong>{' '}
          {showCarousel ? `${enabledBanners.length} banner(s)` : 'Off'}
        </span>
      </div>
    </div>
  );
};

export default HomeMobilePreview;
