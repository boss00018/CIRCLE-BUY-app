import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<any> = {
  prefixes: ['circlebuy://'],
  config: {
    screens: {
      BuyerHome: 'product/:id', // example; extend later
    },
  },
};