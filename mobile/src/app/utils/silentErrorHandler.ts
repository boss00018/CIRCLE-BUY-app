// Silent error handler utility
export const silentTryCatch = async <T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    // Silently handle all errors
    return fallback;
  }
};

export const silentTryCatchSync = <T>(
  fn: () => T,
  fallback?: T
): T | undefined => {
  try {
    return fn();
  } catch (error) {
    // Silently handle all errors
    return fallback;
  }
};

// Wrap any function to make it silent
export const makeSilent = <T extends (...args: any[]) => any>(fn: T): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      if (result && typeof result.catch === 'function') {
        return result.catch(() => {});
      }
      return result;
    } catch (error) {
      // Silently handle all errors
      return undefined;
    }
  }) as T;
};

// Silent console methods
export const silentConsole = {
  log: () => {},
  warn: () => {},
  error: () => {},
  info: () => {},
  debug: () => {},
};