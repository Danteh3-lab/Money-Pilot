/**
 * Accessibility Test Component
 * 
 * This component is used to manually verify accessibility features.
 * It's not meant for production use, but for testing purposes.
 */

import { useState } from 'react';

const AccessibilityTest = () => {
  const [announcement, setAnnouncement] = useState('');

  const testKeyboardNavigation = () => {
    setAnnouncement('Keyboard navigation test: Tab through all interactive elements');
  };

  const testScreenReader = () => {
    setAnnouncement('Screen reader test: All charts and metrics should be announced with descriptive labels');
  };

  const testFocusIndicators = () => {
    setAnnouncement('Focus indicator test: All focused elements should have visible blue ring');
  };

  const testColorContrast = () => {
    setAnnouncement('Color contrast test: All text should meet WCAG AA standards (4.5:1 ratio)');
  };

  return (
    <div className="p-6 space-y-6" role="region" aria-label="Accessibility Testing Tools">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Accessibility Testing
      </h1>

      <div 
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="text-sm text-blue-900 dark:text-blue-100">
          {announcement || 'Select a test to begin'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={testKeyboardNavigation}
          className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          aria-label="Test keyboard navigation"
        >
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
            Keyboard Navigation
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Test Tab, Enter, and Space key functionality
          </p>
        </button>

        <button
          onClick={testScreenReader}
          className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          aria-label="Test screen reader support"
        >
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
            Screen Reader Support
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Test ARIA labels and live regions
          </p>
        </button>

        <button
          onClick={testFocusIndicators}
          className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          aria-label="Test focus indicators"
        >
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
            Focus Indicators
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Test visible focus rings on all elements
          </p>
        </button>

        <button
          onClick={testColorContrast}
          className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          aria-label="Test color contrast"
        >
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
            Color Contrast
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Test WCAG AA compliance for text and backgrounds
          </p>
        </button>
      </div>

      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
        <h2 className="font-semibold text-zinc-900 dark:text-white mb-3">
          Accessibility Checklist
        </h2>
        <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>All interactive elements are keyboard accessible</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>ARIA labels on all charts and metrics</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Screen reader announcements for dynamic content</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Visible focus indicators on all elements</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Color contrast meets WCAG AA standards</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Semantic HTML with proper landmarks</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Reduced motion support for animations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Touch-friendly targets on mobile (44x44px minimum)</span>
          </li>
        </ul>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
          Testing Tools
        </h3>
        <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
          <li>• Browser: Use Tab key to navigate, Enter/Space to activate</li>
          <li>• Screen Reader: NVDA (Windows), JAWS (Windows), VoiceOver (Mac)</li>
          <li>• DevTools: Chrome Lighthouse, axe DevTools, WAVE</li>
          <li>• Zoom: Test at 200% zoom level</li>
        </ul>
      </div>
    </div>
  );
};

export default AccessibilityTest;
