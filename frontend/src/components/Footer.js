import React from 'react';
import { Box, Typography, Stack, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';

function Footer() {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        mt: 4,
        py: 4,
        px: 3,
        background: theme.palette.mode === 'light'
          ? 'rgba(255, 255, 255, 0.15)'
          : 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid',
        borderColor: theme.palette.mode === 'light'
          ? 'rgba(255, 255, 255, 0.2)'
          : 'rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>CS</Typography>
        </Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Capitalism Simulation
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
        A distributed microservices platform for free market exchange and discourse.
      </Typography>

      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          height: '1px',
          mx: 'auto',
          mb: 3,
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), rgba(6, 182, 212, 0.5), transparent)',
        }}
      />

      <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 3, flexWrap: 'wrap' }}>
        <FooterLink to="/">Home</FooterLink>
        <FooterLink to="/marketplace">Marketplace</FooterLink>
        <FooterLink to="/discourse">Discourse</FooterLink>
        <FooterLink to="/login">Login</FooterLink>
        <FooterLink to="/register">Register</FooterLink>
      </Stack>

      <Typography variant="caption" sx={{ opacity: 0.6 }}>
        FAF.PAD 21.1 Autumn 2025 - Topic 10: Capitalism Simulation
      </Typography>
    </Box>
  );
}

function FooterLink({ to, children }) {
  return (
    <Typography
      component={Link}
      to={to}
      sx={{
        color: 'text.primary',
        textDecoration: 'none',
        fontWeight: 500,
        fontSize: '0.875rem',
        opacity: 0.8,
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        '&:hover': {
          opacity: 1,
          color: '#8B5CF6',
        },
      }}
    >
      {children}
    </Typography>
  );
}

export default Footer;
