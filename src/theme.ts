import { createTheme, MantineColorsTuple } from '@mantine/core';

const woodBrown: MantineColorsTuple = [
  '#FBF5E6',
  '#F5E6CC',
  '#E8D4A8',
  '#D4B88C',
  '#C4A26E',
  '#A67C52',
  '#8B5A2B',
  '#6B4423',
  '#4A3019',
  '#2D1C0F',
];

const bambooGreen: MantineColorsTuple = [
  '#F0F9F4',
  '#D4EFDF',
  '#A8DFBD',
  '#7CCF9B',
  '#50BF79',
  '#2E8B57',
  '#226B42',
  '#164B2E',
  '#0B2B19',
  '#050F08',
];

const terracotta: MantineColorsTuple = [
  '#FFF5F0',
  '#FFE4D6',
  '#FFC9AD',
  '#FFAE85',
  '#FF935C',
  '#CD5C5C',
  '#A04040',
  '#732E2E',
  '#461C1C',
  '#190A0A',
];

const parchment: MantineColorsTuple = [
  '#FEFCF5',
  '#FAF6E8',
  '#F5EDD1',
  '#F0E4BA',
  '#EBDBA3',
  '#D9C99A',
  '#A8986B',
  '#78674B',
  '#483B26',
  '#18120E',
];

export const theme = createTheme({
  colors: {
    wood: woodBrown,
    bamboo: bambooGreen,
    terracotta: terracotta,
    parchment: parchment,
  },

  primaryColor: 'wood',
  primaryShade: 6,

  fontFamily: '"Noto Serif SC", "ZCOOL XiaoWei", serif',
  fontFamilyMonospace: 'monospace',
  headings: {
    fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2.5rem', lineHeight: '1.3' },
      h2: { fontSize: '2rem', lineHeight: '1.35' },
      h3: { fontSize: '1.5rem', lineHeight: '1.4' },
      h4: { fontSize: '1.25rem', lineHeight: '1.45' },
    },
  },

  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },

  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },

  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },

  defaultGradient: {
    from: 'wood.5',
    to: 'wood.7',
    deg: 135,
  },

  components: {
    Button: {
      styles: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      },
    },

    Slider: {
      styles: {
        track: {
          backgroundColor: '#D4B88C',
        },
        bar: {
          backgroundColor: '#8B5A2B',
        },
        thumb: {
          backgroundColor: '#6B4423',
          borderColor: '#D4B88C',
          width: 18,
          height: 18,
          '&:hover': {
            transform: 'scale(1.1)',
          },
        },
      },
    },

    Card: {
      styles: {
        root: {
          backgroundColor: '#FAF6E8',
          border: '1px solid #E8D4A8',
          boxShadow: '0 2px 8px rgba(139, 90, 43, 0.1)',
        },
      },
    },

    Paper: {
      styles: {
        root: {
          backgroundColor: '#FEFCF5',
        },
      },
    },

    Badge: {
      styles: {
        root: {
          fontWeight: 500,
        },
      },
    },

    Progress: {
      styles: {
        bar: {
          transition: 'width 0.3s ease',
        },
      },
    },
  },

  other: {
    colors: {
      woodLight: '#F5E6CC',
      woodMedium: '#A67C52',
      woodDark: '#6B4423',
      bamboo: '#2E8B57',
      terracotta: '#CD5C5C',
      parchment: '#FBF5E6',
      ink: '#2D1C0F',
    },
  },
});
