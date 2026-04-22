import { useTheme } from '@theme/ThemeContext';
import { ReactNode } from 'react';

interface ITooltipProps {
  children: ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<ITooltipProps> = ({ children, text, position = 'top' }) => {
  const { theme } = useTheme();

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
        };
      case 'bottom':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
        };
      case 'left':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '8px',
        };
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '8px',
        };
      default:
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
        };
    }
  };

  const getArrowStyles = () => {
    switch (position) {
      case 'top':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderTopColor: 'rgba(0, 0, 0, 0.9)',
          borderBottom: 'none',
        };
      case 'bottom':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderBottomColor: 'rgba(0, 0, 0, 0.9)',
          borderTop: 'none',
        };
      case 'left':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderLeftColor: 'rgba(0, 0, 0, 0.9)',
          borderRight: 'none',
        };
      case 'right':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderRightColor: 'rgba(0, 0, 0, 0.9)',
          borderLeft: 'none',
        };
      default:
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderTopColor: 'rgba(0, 0, 0, 0.9)',
          borderBottom: 'none',
        };
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      {children}
      <div
        style={{
          position: 'absolute',
          ...getPositionStyles(),
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: '#ffffff',
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          borderRadius: theme.borderRadius.sm,
          fontSize: '0.75rem',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.2s, transform 0.2s',
          transform: position === 'top' || position === 'bottom' 
            ? 'translateX(-50%) translateY(4px)' 
            : 'translateY(-50%) translateX(4px)',
        }}
        className="tooltip-content"
      >
        {text}
        <div
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            border: '4px solid transparent',
            ...getArrowStyles(),
          }}
        />
      </div>
      <style>{`
        div[style*="position: relative"]:hover .tooltip-content {
          opacity: 1 !important;
          transform: ${position === 'top' || position === 'bottom' 
            ? 'translateX(-50%) translateY(0)' 
            : 'translateY(-50%) translateX(0)'} !important;
        }
      `}</style>
    </div>
  );
};

