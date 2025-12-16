import { describe, it, expect } from 'vitest';

// Helper function to simulate MetricCard's formatValue logic
const formatValue = (val, format) => {
  if (val === null || val === undefined) return "—";
  
  if (format === "currency") {
    return parseFloat(val).toFixed(2);
  } else if (format === "percentage") {
    return `${parseFloat(val).toFixed(1)}%`;
  } else if (format === "number") {
    return val.toString();
  }
  return val;
};

// Helper to determine if currency should be shown
const shouldShowCurrency = (format, value) => {
  return format === "currency" && value !== null && value !== undefined;
};

// Helper to determine styling based on isNegative flag
const getBorderClass = (isNegative) => {
  return isNegative
    ? "border-rose-300 dark:border-rose-800"
    : "border-zinc-200 dark:border-zinc-800";
};

const getValueClass = (isNegative) => {
  return isNegative
    ? "text-rose-600 dark:text-rose-400"
    : "text-zinc-900 dark:text-white";
};

describe('MetricCard Component Logic', () => {
  describe('Metric display with various values', () => {
    it('formats currency values correctly', () => {
      expect(formatValue(1234.567, 'currency')).toBe('1234.57');
      expect(formatValue(0, 'currency')).toBe('0.00');
      expect(formatValue(100, 'currency')).toBe('100.00');
    });

    it('formats percentage values correctly', () => {
      expect(formatValue(45.678, 'percentage')).toBe('45.7%');
      expect(formatValue(0, 'percentage')).toBe('0.0%');
      expect(formatValue(100, 'percentage')).toBe('100.0%');
      expect(formatValue(-15.5, 'percentage')).toBe('-15.5%');
    });

    it('formats number values correctly', () => {
      expect(formatValue(42, 'number')).toBe('42');
      expect(formatValue(0, 'number')).toBe('0');
      expect(formatValue(1000, 'number')).toBe('1000');
    });

    it('shows currency symbol only for currency format with valid values', () => {
      expect(shouldShowCurrency('currency', 100)).toBe(true);
      expect(shouldShowCurrency('currency', 0)).toBe(true);
      expect(shouldShowCurrency('percentage', 50)).toBe(false);
      expect(shouldShowCurrency('number', 42)).toBe(false);
      expect(shouldShowCurrency('currency', null)).toBe(false);
      expect(shouldShowCurrency('currency', undefined)).toBe(false);
    });
  });

  describe('Negative savings rate styling', () => {
    it('applies rose border for negative values', () => {
      const borderClass = getBorderClass(true);
      expect(borderClass).toContain('border-rose-300');
      expect(borderClass).toContain('dark:border-rose-800');
    });

    it('applies default border for non-negative values', () => {
      const borderClass = getBorderClass(false);
      expect(borderClass).toContain('border-zinc-200');
      expect(borderClass).toContain('dark:border-zinc-800');
    });

    it('applies rose text color for negative values', () => {
      const valueClass = getValueClass(true);
      expect(valueClass).toContain('text-rose-600');
      expect(valueClass).toContain('dark:text-rose-400');
    });

    it('applies default text color for non-negative values', () => {
      const valueClass = getValueClass(false);
      expect(valueClass).toContain('text-zinc-900');
      expect(valueClass).toContain('dark:text-white');
    });
  });

  describe('Empty/null value handling', () => {
    it('displays em dash for null values', () => {
      expect(formatValue(null, 'currency')).toBe('—');
      expect(formatValue(null, 'percentage')).toBe('—');
      expect(formatValue(null, 'number')).toBe('—');
    });

    it('displays em dash for undefined values', () => {
      expect(formatValue(undefined, 'currency')).toBe('—');
      expect(formatValue(undefined, 'percentage')).toBe('—');
      expect(formatValue(undefined, 'number')).toBe('—');
    });

    it('does not show currency symbol for null/undefined values', () => {
      expect(shouldShowCurrency('currency', null)).toBe(false);
      expect(shouldShowCurrency('currency', undefined)).toBe(false);
    });

    it('handles zero as a valid value', () => {
      expect(formatValue(0, 'currency')).toBe('0.00');
      expect(formatValue(0, 'percentage')).toBe('0.0%');
      expect(formatValue(0, 'number')).toBe('0');
      expect(shouldShowCurrency('currency', 0)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('handles very large numbers', () => {
      expect(formatValue(999999.99, 'currency')).toBe('999999.99');
      expect(formatValue(1000000, 'percentage')).toBe('1000000.0%');
    });

    it('handles very small numbers', () => {
      expect(formatValue(0.01, 'currency')).toBe('0.01');
      expect(formatValue(0.001, 'currency')).toBe('0.00');
      expect(formatValue(0.1, 'percentage')).toBe('0.1%');
    });

    it('handles negative numbers', () => {
      expect(formatValue(-100, 'currency')).toBe('-100.00');
      expect(formatValue(-50.5, 'percentage')).toBe('-50.5%');
      expect(formatValue(-42, 'number')).toBe('-42');
    });
  });
});
