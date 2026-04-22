import { Modal } from '@components/Modal/Modal';
import { useTheme } from '@theme/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect,useRef, useState } from 'react';

interface IImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  title?: string;
}

export const ImagePreviewModal: React.FC<IImagePreviewModalProps> = ({
  isOpen,
  onClose,
  images,
  title = 'Product Images',
}) => {
  const { theme } = useTheme();
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getImageSrc = (img: string) => {
    if (img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    return `data:image/jpeg;base64,${img}`;
  };

  const handleImageError = (index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  };

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      checkScrollButtons();
      scrollContainerRef.current.addEventListener('scroll', checkScrollButtons);
      return () => {
        scrollContainerRef.current?.removeEventListener('scroll', checkScrollButtons);
      };
    }
  }, [isOpen, images]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  if (images.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
        <div
          style={{
            padding: theme.spacing.xl,
            textAlign: 'center',
            color: theme.colors.textSecondary,
          }}
        >
          No images available
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div
        style={{
          padding: theme.spacing.sm,
          position: 'relative',
        }}
      >
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            style={{
              position: 'absolute',
              left: theme.spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            style={{
              position: 'absolute',
              right: theme.spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: theme.spacing.md,
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: theme.spacing.sm,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onScroll={checkScrollButtons}
          className="scrollbar-hide"
        >
          {images.map((img, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                flexShrink: 0,
                width: 'auto',
                height: '300px',
                borderRadius: theme.borderRadius.md,
                overflow: 'hidden',
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.surface,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${theme.colors.primary}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {failedImages.has(index) ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    minWidth: '300px',
                    color: theme.colors.textSecondary,
                    fontSize: '0.875rem',
                  }}
                >
                  Failed to load
                </div>
              ) : (
                <img
                  src={getImageSrc(img)}
                  alt={`${title} ${index + 1}`}
                  style={{
                    width: 'auto',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  onError={() => handleImageError(index)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

