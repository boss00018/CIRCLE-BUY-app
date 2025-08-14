const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  transformer: {
    unstable_allowRequireContext: true,
  },
  resolver: {
    // Suppress resolver warnings
    disableHierarchicalLookup: false,
  },
};

// Suppress Metro warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(' ');
  if (
    message.includes('Metro') ||
    message.includes('Warning:') ||
    message.includes('deprecated') ||
    message.includes('componentWillReceiveProps') ||
    message.includes('componentWillMount')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);