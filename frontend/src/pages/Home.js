import React from 'react';
import { Typography, Container, Grid, Card, CardContent, CardActionArea, Fade, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import StoreIcon from '@mui/icons-material/Store';
import ForumIcon from '@mui/icons-material/Forum';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MonitorIcon from '@mui/icons-material/Monitor';
import ApiIcon from '@mui/icons-material/Api';
import ArchitectureIcon from '@mui/icons-material/AccountTree';

function Home() {
  const pages = [
    { title: 'Marketplace', description: 'Trade assets, innovations, services, and knowledge in a free market exchange.', link: '/marketplace', icon: <StoreIcon sx={{ fontSize: 40 }} />, color: '#8B5CF6' },
    { title: 'Discourse', description: 'Join economic, philosophical, and strategic discussions in public or private channels.', link: '/discourse', icon: <ForumIcon sx={{ fontSize: 40 }} />, color: '#06B6D4' },
    { title: 'Login', description: 'Access your account to start trading and discussing.', link: '/login', icon: <LoginIcon sx={{ fontSize: 40 }} />, color: '#10B981' },
    { title: 'Register', description: 'Create a new account to participate in the simulation.', link: '/register', icon: <PersonAddIcon sx={{ fontSize: 40 }} />, color: '#EC4899' },
    { title: 'Grafana', description: 'View real-time metrics, cache performance, and load balancer stats.', link: 'http://localhost:3004', icon: <MonitorIcon sx={{ fontSize: 40 }} />, external: true, color: '#F59E0B' },
    { title: 'API Docs', description: 'Explore the FastAPI auto-generated documentation.', link: 'http://localhost:8000/docs', icon: <ApiIcon sx={{ fontSize: 40 }} />, external: true, color: '#3B82F6' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Fade in timeout={800}>
        <Box>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                mb: 2,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 50%, #EC4899 100%)',
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
                opacity: 0.8,
                maxWidth: 700,
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.6,
              }}
            >
              A distributed microservices platform demonstrating free market principles. Trade assets and innovations
              in the marketplace, engage in economic discourse, and watch the system scale through load balancing.
            </Typography>
          </Box>

          <Box
            sx={{
              mb: 6,
              p: 3,
              borderRadius: 3,
              background: theme => theme.palette.mode === 'light'
                ? 'rgba(139, 92, 246, 0.08)'
                : 'rgba(139, 92, 246, 0.15)',
              border: '1px solid',
              borderColor: 'rgba(139, 92, 246, 0.2)',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                fontWeight: 600,
                color: '#8B5CF6',
              }}
            >
              <ArchitectureIcon /> Architecture
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
              <Box component="span" sx={{ fontWeight: 500, color: '#8B5CF6' }}>Python Gateway</Box> (FastAPI) +
              <Box component="span" sx={{ fontWeight: 500, color: '#EF4444' }}> Redis</Box> Cache +
              <Box component="span" sx={{ fontWeight: 500, color: '#10B981' }}> Round Robin LB</Box> &rarr;
              <Box component="span" sx={{ fontWeight: 500, color: '#F59E0B' }}> Node.js Services</Box> (x3 replicas each) &rarr;
              <Box component="span" sx={{ fontWeight: 500, color: '#06B6D4' }}> MongoDB</Box> /
              <Box component="span" sx={{ fontWeight: 500, color: '#3B82F6' }}> PostgreSQL</Box>
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              Prometheus + Grafana for monitoring | JWT Authentication | Docker Compose orchestration
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {pages.map((p, index) => (
              <Grid item xs={12} sm={6} md={4} key={p.title}>
                <Fade in timeout={600 + index * 100}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: `linear-gradient(90deg, ${p.color}, transparent)`,
                      },
                    }}
                  >
                    <CardActionArea
                      component={p.external ? 'a' : Link}
                      to={p.external ? undefined : p.link}
                      href={p.external ? p.link : undefined}
                      target={p.external ? '_blank' : undefined}
                      sx={{
                        height: '100%',
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <CardContent sx={{ p: 0 }}>
                        <Box
                          sx={{
                            width: 72,
                            height: 72,
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                            mx: 'auto',
                            background: `linear-gradient(135deg, ${p.color}20, ${p.color}40)`,
                            border: `1px solid ${p.color}30`,
                            color: p.color,
                            transition: 'all 0.3s ease',
                            '.MuiCardActionArea-root:hover &': {
                              transform: 'scale(1.1) rotate(5deg)',
                              boxShadow: `0 8px 24px ${p.color}40`,
                            },
                          }}
                        >
                          {p.icon}
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            mb: 1,
                          }}
                        >
                          {p.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ opacity: 0.7 }}
                        >
                          {p.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Fade>
      <Box
        sx={{
          width: '100%',
          maxWidth: 300,
          height: '1px',
          mx: 'auto',
          my: 5,
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.3), transparent)',
        }}
      />
      <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.5 }}>
        FAF.PAD 21.1 Autumn 2025 - Topic 10: Capitalism Simulation
      </Typography>
    </Container>
  );
}

export default Home;
