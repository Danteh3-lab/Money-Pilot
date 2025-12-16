/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * React hook for creating a debounced callback
 * 
 * @param {Function} callback - The callback to debounce
 * @param {number} delay - The delay in milliseconds
 * @param {Array} dependencies - Dependencies array for useCallback
 * @returns {Function} The debounced callback
 */
export function useDebouncedCallback(callback, delay, dependencies = []) {
  const { useCallback, useRef, useEffect } = require('react');
  
  const timeoutRef = useRef(null);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay, ...dependencies]);
}
