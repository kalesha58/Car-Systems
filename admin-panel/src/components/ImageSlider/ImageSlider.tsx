import { useTheme } from '@theme/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect,useState } from 'react';

interface IImageSliderProps {
  images: string[];
  alt?: string;
}

export const ImageSlider: React.FC<IImageSliderProps> = ({ images, alt = 'Image' }) => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (images.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.border}`,
          color: theme.colors.textSecondary,
        }}
      >
        No images available
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
      }}
    >
      {/* Main Image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '500px',
          overflow: 'hidden',
        }}
      >
        <img
          src={
            images[currentIndex].startsWith('data:') || images[currentIndex].startsWith('http://') || images[currentIndex].startsWith('https://')
              ? images[currentIndex]
              : `data:image/jpeg;base64,${images[currentIndex]}`
          }
          alt={`${alt} ${currentIndex + 1}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: theme.colors.surface,
          }}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              style={{
                position: 'absolute',
                left: theme.spacing.md,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
                zIndex: 2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={goToNext}
              style={{
                position: 'absolute',
                right: theme.spacing.md,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
                zIndex: 2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: theme.spacing.md,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#ffffff',
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              borderRadius: theme.borderRadius.xl,
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: theme.spacing.sm,
            padding: theme.spacing.md,
            overflowX: 'auto',
            backgroundColor: theme.colors.surface,
            borderTop: `1px solid ${theme.colors.border}`,
          }}
        >
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                flexShrink: 0,
                width: '80px',
                height: '80px',
                borderRadius: theme.borderRadius.md,
                overflow: 'hidden',
                border: `2px solid ${currentIndex === index ? theme.colors.primary : theme.colors.border}`,
                cursor: 'pointer',
                padding: 0,
                backgroundColor: 'transparent',
                transition: 'all 0.2s',
                opacity: currentIndex === index ? 1 : 0.7,
              }}
              onMouseEnter={(e) => {
                if (currentIndex !== index) {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentIndex !== index) {
                  e.currentTarget.style.opacity = '0.7';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
              aria-label={`Go to image ${index + 1}`}
            >
              <img
                src={
                  img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://')
                    ? img
                    : `data:image/jpeg;base64,${img}`
                }
                alt={`${alt} thumbnail ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

