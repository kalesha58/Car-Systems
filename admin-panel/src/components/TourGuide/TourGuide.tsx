import { useTheme } from '@theme/ThemeContext';
import { AnimatePresence,motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, HelpCircle,X } from 'lucide-react';
import React, { useEffect, useRef,useState } from 'react';

export interface ITourStep {
  target: string; // CSS selector or data attribute
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  offset?: number;
}

interface ITourGuideProps {
  steps: ITourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  showSkip?: boolean;
}

export const TourGuide: React.FC<ITourGuideProps> = ({
  steps,
  isOpen,
  onClose,
  onComplete,
  showSkip = true,
}) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || steps.length === 0) return;

    const step = steps[currentStep];
    if (!step) return;

    // Find the target element
    const element = document.querySelector(step.target) as HTMLElement;
    
    if (element) {
      setHighlightedElement(element);
      // Scroll element into view
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      // Update tooltip position after scroll
      const updateTimer = setTimeout(() => {
        updateTooltipPosition(element, step);
      }, 600);

      // Update tooltip position on scroll/resize
      const handleScroll = () => {
        if (element && tooltipRef.current) {
          updateTooltipPosition(element, step);
        }
      };

      const handleResize = () => {
        if (element && tooltipRef.current) {
          updateTooltipPosition(element, step);
        }
      };

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(updateTimer);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, isOpen, steps]);

  const updateTooltipPosition = (element: HTMLElement, step: ITourStep) => {
    if (!tooltipRef.current) return;

    const rect = element.getBoundingClientRect();
    const tooltip = tooltipRef.current;
    const position = step.position || 'bottom';
    const offset = step.offset || 20;

    // Wait for tooltip to be rendered to get its dimensions
    requestAnimationFrame(() => {
      if (!tooltipRef.current) return;

      const tooltipRect = tooltip.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - tooltipRect.height - offset;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + offset;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2;
          left = rect.left - tooltipRect.width - offset;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2;
          left = rect.right + offset;
          break;
        case 'center':
          top = window.innerHeight / 2 - tooltipRect.height / 2;
          left = window.innerWidth / 2 - tooltipRect.width / 2;
          break;
      }

      // Keep tooltip within viewport
      const padding = 20;
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCurrentStep(0);
    setHighlightedElement(null);
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen || steps.length === 0) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay with hole for highlighted element */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] pointer-events-auto"
            style={{
              background: highlightedElement
                ? (() => {
                    const rect = highlightedElement.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const radius = Math.max(rect.width, rect.height) / 2 + 15;
                    return `radial-gradient(
                      circle at ${centerX}px ${centerY}px,
                      transparent ${radius}px,
                      rgba(0, 0, 0, 0.75) ${radius + 10}px
                    )`;
                  })()
                : 'rgba(0, 0, 0, 0.75)',
            }}
            onClick={(e) => {
              // Only close if clicking on overlay, not on highlighted element
              if (e.target === overlayRef.current) {
                handleComplete();
              }
            }}
          />

          {/* Tooltip */}
          {step && (
            <motion.div
              ref={tooltipRef}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="fixed z-[1001] pointer-events-auto"
              style={{
                maxWidth: '400px',
                minWidth: '320px',
              }}
            >
              <div
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `2px solid ${theme.colors.primary}`,
                  borderRadius: theme.borderRadius.lg,
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                  padding: theme.spacing.lg,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: theme.spacing.md,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flex: 1 }}>
                    <div
                      style={{
                        padding: theme.spacing.sm,
                        borderRadius: theme.borderRadius.md,
                        backgroundColor: `${theme.colors.primary}20`,
                        color: theme.colors.primary,
                      }}
                    >
                      <HelpCircle size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: theme.colors.text,
                          marginBottom: theme.spacing.xs,
                        }}
                      >
                        {step.title}
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.75rem',
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Step {currentStep + 1} of {steps.length}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleComplete}
                    style={{
                      padding: theme.spacing.xs,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: theme.colors.textSecondary,
                      borderRadius: theme.borderRadius.sm,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.surface;
                      e.currentTarget.style.color = theme.colors.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = theme.colors.textSecondary;
                    }}
                    aria-label="Close tour"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Content */}
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: theme.colors.text,
                    lineHeight: '1.6',
                    marginBottom: theme.spacing.lg,
                  }}
                >
                  {step.content}
                </p>

                {/* Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: theme.spacing.sm,
                  }}
                >
                  {showSkip && (
                    <button
                      onClick={handleSkip}
                      style={{
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        border: `1px solid ${theme.colors.border}`,
                        background: 'transparent',
                        borderRadius: theme.borderRadius.md,
                        cursor: 'pointer',
                        color: theme.colors.textSecondary,
                        fontSize: '0.875rem',
                        fontWeight: '500',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.surface;
                        e.currentTarget.style.color = theme.colors.text;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textSecondary;
                      }}
                    >
                      Skip Tour
                    </button>
                  )}

                  <div style={{ display: 'flex', gap: theme.spacing.sm, marginLeft: 'auto' }}>
                    {!isFirstStep && (
                      <button
                        onClick={handlePrevious}
                        style={{
                          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                          border: `1px solid ${theme.colors.border}`,
                          background: 'transparent',
                          borderRadius: theme.borderRadius.md,
                          cursor: 'pointer',
                          color: theme.colors.text,
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.xs,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.surface;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      style={{
                        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                        border: 'none',
                        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                        borderRadius: theme.borderRadius.md,
                        cursor: 'pointer',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.xs,
                        boxShadow: `0 4px 12px ${theme.colors.primary}40`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = `0 6px 16px ${theme.colors.primary}60`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = `0 4px 12px ${theme.colors.primary}40`;
                      }}
                    >
                      {isLastStep ? 'Finish' : 'Next'}
                      {!isLastStep && <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

