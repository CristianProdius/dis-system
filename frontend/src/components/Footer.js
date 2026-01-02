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
        py: 3,
        px: 2,
        backgroundColor: theme.palette.primary.main,
        color: '#fff',
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        Capitalism Simulation
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        A distributed microservices platform for free market exchange and discourse.
      </Typography>

      <Box sx={{ borderBottom: '1px solid #fff', mb: 2 }}></Box>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <FooterLink to="/">Home</FooterLink>
        <FooterLink to="/marketplace">Marketplace</FooterLink>
        <FooterLink to="/discourse">Discourse</FooterLink>
        <FooterLink to="/login">Login</FooterLink>
        <FooterLink to="/register">Register</FooterLink>
      </Stack>

      <Typography variant="body2" sx={{ mt: 3, opacity: 0.9 }}>
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
        color: '#fff',
        textDecoration: 'none',
        fontWeight: 500,
        ':hover': { textDecoration: 'underline' },
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Typography>
  );
}

export default Footer;
