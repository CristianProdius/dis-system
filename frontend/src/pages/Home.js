import React from 'react';
import { Typography, Container, Grid, Card, CardContent, CardActionArea, Slide, Box } from '@mui/material';
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
    { title: 'Marketplace', description: 'Trade assets, innovations, services, and knowledge in a free market exchange.', link: '/marketplace', icon: <StoreIcon fontSize="large" /> },
    { title: 'Discourse', description: 'Join economic, philosophical, and strategic discussions in public or private channels.', link: '/discourse', icon: <ForumIcon fontSize="large" /> },
    { title: 'Login', description: 'Access your account to start trading and discussing.', link: '/login', icon: <LoginIcon fontSize="large" /> },
    { title: 'Register', description: 'Create a new account to participate in the simulation.', link: '/register', icon: <PersonAddIcon fontSize="large" /> },
    { title: 'Grafana', description: 'View real-time metrics, cache performance, and load balancer stats.', link: 'http://localhost:3004', icon: <MonitorIcon fontSize="large" />, external: true },
    { title: 'API Docs', description: 'Explore the FastAPI auto-generated documentation.', link: 'http://localhost:8000/docs', icon: <ApiIcon fontSize="large" />, external: true },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Slide direction="down" in mountOnEnter unmountOnExit>
        <Box>
          <Typography variant="h3" mb={2} sx={{ fontWeight: 700 }}>
            Capitalism Simulation
          </Typography>
          <Typography variant="body1" mb={2} sx={{ fontSize: '1.1rem', maxWidth: 800 }}>
            A distributed microservices platform demonstrating free market principles. Trade assets and innovations
            in the marketplace, engage in economic discourse, and watch the system scale through load balancing.
          </Typography>

          <Box sx={{ mb: 4, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ArchitectureIcon /> Architecture
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Python Gateway (FastAPI) + Redis Cache + Round Robin LB &rarr; Node.js Services (x3 replicas each) &rarr; MongoDB / PostgreSQL
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Prometheus + Grafana for monitoring | JWT Authentication | Docker Compose orchestration
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {pages.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.title}>
                <Card
                  sx={{
                    ':hover': { transform: 'scale(1.03)' },
                    transition: 'transform 0.2s ease-in-out',
                    minHeight: 180,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    p: 2,
                  }}
                >
                  <CardActionArea
                    component={p.external ? 'a' : Link}
                    to={p.external ? undefined : p.link}
                    href={p.external ? p.link : undefined}
                    target={p.external ? '_blank' : undefined}
                    sx={{ height: '100%' }}
                  >
                    <CardContent>
                      {p.icon}
                      <Typography variant="h6" sx={{ fontWeight: 600, mt: 2 }}>
                        {p.title}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                        {p.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Slide>
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', my: 3 }} />
      <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.8, mb: 4 }}>
        FAF.PAD 21.1 Autumn 2025 - Topic 10: Capitalism Simulation
      </Typography>
    </Container>
  );
}

export default Home;
