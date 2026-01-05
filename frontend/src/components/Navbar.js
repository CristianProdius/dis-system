import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Button, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import StoreIcon from '@mui/icons-material/Store';
import ForumIcon from '@mui/icons-material/Forum';
import MonitorIcon from '@mui/icons-material/Monitor';
import LogoutIcon from '@mui/icons-material/Logout';

function Navbar({ mode, setMode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleToggleMode = () => {
    setMode(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const openGrafana = () => {
    window.open('http://localhost:3004', '_blank');
  };

  const baseNavLinks = [
    { to: '/', label: 'Home', icon: <HomeIcon /> },
  ];

  let navLinks = [...baseNavLinks];
  if (isLoggedIn) {
    navLinks.push({ to: '/marketplace', label: 'Marketplace', icon: <StoreIcon /> });
    navLinks.push({ to: '/discourse', label: 'Discourse', icon: <ForumIcon /> });
    navLinks.push({ to: '#', label: 'Grafana', icon: <MonitorIcon />, action: openGrafana });
    navLinks.push({ to: '#', label: 'Logout', icon: <LogoutIcon />, action: handleLogout, isLogout: true });
  } else {
    navLinks.push({ to: '/login', label: 'Login', icon: <LoginIcon /> });
    navLinks.push({ to: '/register', label: 'Register', icon: <PersonAddIcon /> });
  }

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
            }}
            color="inherit"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>CS</Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                display: { xs: 'none', md: 'block' },
                background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Capitalism Simulation
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                display: { xs: 'block', md: 'none' },
                background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              CapSim
            </Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
            {navLinks.map(link => {
              const isActive = location.pathname === link.to;
              const buttonStyle = {
                px: 2,
                py: 1,
                borderRadius: '12px',
                position: 'relative',
                color: link.isLogout ? '#EF4444' : 'inherit',
                ...(isActive && {
                  background: 'rgba(139, 92, 246, 0.15)',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: '2px',
                    background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
                    borderRadius: '2px',
                  },
                }),
                '&:hover': {
                  background: link.isLogout
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(139, 92, 246, 0.1)',
                },
              };

              if (link.action) {
                return (
                  <Button
                    key={link.label}
                    color="inherit"
                    startIcon={link.icon}
                    onClick={link.action}
                    sx={buttonStyle}
                  >
                    {link.label}
                  </Button>
                );
              } else {
                return (
                  <Button
                    key={link.to}
                    component={Link}
                    to={link.to}
                    color="inherit"
                    startIcon={link.icon}
                    sx={buttonStyle}
                  >
                    {link.label}
                  </Button>
                );
              }
            })}
          </Box>
          <IconButton
            color="inherit"
            onClick={handleToggleMode}
            sx={{
              ml: 1,
              background: mode === 'light'
                ? 'rgba(139, 92, 246, 0.1)'
                : 'rgba(6, 182, 212, 0.1)',
              '&:hover': {
                background: mode === 'light'
                  ? 'rgba(139, 92, 246, 0.2)'
                  : 'rgba(6, 182, 212, 0.2)',
              },
            }}
          >
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, pt: 2 }}>
          <Box sx={{ px: 2, pb: 2, mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#fff' }}>CS</Typography>
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                CapSim
              </Typography>
            </Box>
          </Box>
          <List>
            {navLinks.map(link => {
              const isActive = location.pathname === link.to;
              const listItemStyles = {
                mx: 1,
                borderRadius: '12px',
                mb: 0.5,
                color: link.isLogout ? '#EF4444' : 'inherit',
                ...(isActive && {
                  background: 'rgba(139, 92, 246, 0.15)',
                }),
                '&:hover': {
                  background: link.isLogout
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(139, 92, 246, 0.1)',
                },
              };

              const iconStyles = {
                color: isActive ? '#8B5CF6' : link.isLogout ? '#EF4444' : 'inherit',
                minWidth: 40,
              };

              if (link.action) {
                return (
                  <ListItemButton
                    key={link.label}
                    onClick={() => {
                      setDrawerOpen(false);
                      link.action();
                    }}
                    sx={listItemStyles}
                  >
                    <ListItemIcon sx={iconStyles}>{link.icon}</ListItemIcon>
                    <ListItemText
                      primary={link.label}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                );
              } else {
                return (
                  <ListItemButton
                    key={link.to}
                    component={Link}
                    to={link.to}
                    onClick={() => setDrawerOpen(false)}
                    sx={listItemStyles}
                  >
                    <ListItemIcon sx={iconStyles}>{link.icon}</ListItemIcon>
                    <ListItemText
                      primary={link.label}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                );
              }
            })}
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default Navbar;
