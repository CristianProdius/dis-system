import { createTheme } from '@mui/material/styles';

// Glassmorphism design tokens
const glassTokens = {
  light: {
    glass: 'rgba(255, 255, 255, 0.15)',
    glassHover: 'rgba(255, 255, 255, 0.25)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    glassStrong: 'rgba(255, 255, 255, 0.4)',
  },
  dark: {
    glass: 'rgba(0, 0, 0, 0.25)',
    glassHover: 'rgba(0, 0, 0, 0.35)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassStrong: 'rgba(0, 0, 0, 0.5)',
  },
};

export const getDesignTokens = mode => {
  const glass = glassTokens[mode];

  return {
    palette: {
      mode,
      primary: {
        main: '#8B5CF6', // Violet
        light: '#A78BFA',
        dark: '#7C3AED',
      },
      secondary: {
        main: '#06B6D4', // Cyan
        light: '#22D3EE',
        dark: '#0891B2',
      },
      accent: {
        main: '#EC4899', // Pink
        light: '#F472B6',
        dark: '#DB2777',
      },
      success: {
        main: '#10B981',
        light: '#34D399',
        dark: '#059669',
      },
      warning: {
        main: '#F59E0B',
        light: '#FBBF24',
        dark: '#D97706',
      },
      error: {
        main: '#EF4444',
        light: '#F87171',
        dark: '#DC2626',
      },
      ...(mode === 'light'
        ? {
            background: {
              default: 'transparent',
              paper: glass.glass,
            },
            text: {
              primary: '#1F2937',
              secondary: '#4B5563',
            },
          }
        : {
            background: {
              default: 'transparent',
              paper: glass.glass,
            },
            text: {
              primary: '#F9FAFB',
              secondary: '#D1D5DB',
            },
          }),
      glass,
    },
    typography: {
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h4: {
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        fontWeight: 500,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: glass.glass,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${glass.glassBorder}`,
            boxShadow: mode === 'light'
              ? '0 8px 32px rgba(139, 92, 246, 0.1)'
              : '0 8px 32px rgba(0, 0, 0, 0.3)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: glass.glass,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${glass.glassBorder}`,
            boxShadow: mode === 'light'
              ? '0 8px 32px rgba(139, 92, 246, 0.1)'
              : '0 8px 32px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: mode === 'light'
                ? '0 20px 40px rgba(139, 92, 246, 0.2)'
                : '0 20px 40px rgba(0, 0, 0, 0.4)',
              backgroundColor: glass.glassHover,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backgroundColor: glass.glassStrong,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${glass.glassBorder}`,
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: mode === 'light'
              ? 'rgba(255, 255, 255, 0.85)'
              : 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${glass.glassBorder}`,
            boxShadow: mode === 'light'
              ? '0 1px 3px rgba(0, 0, 0, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.3)',
            color: mode === 'light' ? '#1F2937' : '#F9FAFB',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backgroundColor: glass.glassStrong,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRight: `1px solid ${glass.glassBorder}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '10px 24px',
            fontWeight: 500,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          contained: {
            background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #7C3AED 0%, #0891B2 100%)',
              boxShadow: '0 6px 20px rgba(139, 92, 246, 0.5)',
              transform: 'translateY(-2px)',
            },
          },
          outlined: {
            borderColor: glass.glassBorder,
            backgroundColor: glass.glass,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            '&:hover': {
              backgroundColor: glass.glassHover,
              borderColor: '#8B5CF6',
            },
          },
          text: {
            '&:hover': {
              backgroundColor: glass.glass,
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: glass.glass,
              transform: 'scale(1.1)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: glass.glass,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: 12,
              transition: 'all 0.2s ease',
              '& fieldset': {
                borderColor: glass.glassBorder,
                transition: 'all 0.2s ease',
              },
              '&:hover fieldset': {
                borderColor: '#8B5CF6',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#8B5CF6',
                boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.2)',
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: glass.glass,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 12,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: glass.glassBorder,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#8B5CF6',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#8B5CF6',
              boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.2)',
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: glass.glassStrong,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${glass.glassBorder}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            fontWeight: 500,
          },
          filled: {
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(139, 92, 246, 0.3)',
            },
          },
          outlined: {
            borderColor: glass.glassBorder,
            backgroundColor: glass.glass,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 12,
          },
          standardSuccess: {
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          },
          standardError: {
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          },
          standardWarning: {
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          },
          standardInfo: {
            backgroundColor: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: glass.glassStrong,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${glass.glassBorder}`,
            borderRadius: 8,
            fontSize: '0.875rem',
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            border: `2px solid ${glass.glassBorder}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: '#8B5CF6',
          },
        },
      },
    },
  };
};

export const createAppTheme = mode => createTheme(getDesignTokens(mode));
