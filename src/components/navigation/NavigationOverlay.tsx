/**
 * Navigation Overlay Component
 * 
 * Semi-transparent overlay that appears behind the sliding navigation panel
 * with click-to-close functionality and smooth fade animations
 */

import React, { useCallback, useEffect } from 'react';

interface NavigationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NavigationOverlay: React.FC<NavigationOverlayProps> = React.memo(({
  isOpen,
  onClose,
  className = ''
}) => {
  // Handle overlay click to close panel
  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the overlay, not on child elements
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Handle touch events for mobile
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    // Prevent default to avoid any unwanted behaviors
    if (event.target === event.currentTarget) {
      event.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    // Close panel on touch end if touching the overlay directly
    if (event.target === event.currentTarget) {
      event.preventDefault();
      onClose();
    }
  }, [onClose]);

  // Prevent scroll on body when overlay is open
  useEffect(() => {
    if (isOpen) {
      // Prevent background scroll
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out z-40 ${className}`}
      style={{
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none'
      }}
      onClick={handleOverlayClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex={-1}
      aria-label="Close navigation panel"
      aria-hidden="true"
    />
  );
});

NavigationOverlay.displayName = 'NavigationOverlay';

export default NavigationOverlay;
