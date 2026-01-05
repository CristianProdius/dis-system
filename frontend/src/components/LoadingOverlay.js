import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

function LoadingOverlay({ loading }) {
  if (!loading) return null;
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          p: 4,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress
            size={56}
            thickness={3}
            sx={{
              color: '#8B5CF6',
            }}
          />
          <CircularProgress
            size={56}
            thickness={3}
            sx={{
              color: '#06B6D4',
              position: 'absolute',
              animationDuration: '1.5s',
              opacity: 0.4,
            }}
          />
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 500,
          }}
        >
          Loading...
        </Typography>
      </Box>
    </Box>
  );
}

export default LoadingOverlay;
