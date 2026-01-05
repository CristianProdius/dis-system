import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Paper, Box, Fade } from '@mui/material';
import { loginUser } from '../services/api';
import { setToken } from '../services/auth';
import { useNavigate, Link } from 'react-router-dom';
import LoadingOverlay from '../components/LoadingOverlay';
import LoginIcon from '@mui/icons-material/Login';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await loginUser(username, password);
      setToken(res.data.token);
      navigate('/marketplace');
    } catch (err) {
      console.error(err);
      setError('Invalid username or password, or an error has occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
      <LoadingOverlay loading={loading} />
      <Fade in timeout={600}>
        <Paper
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 420,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
            },
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <LoginIcon sx={{ fontSize: 32, color: '#8B5CF6' }} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
              Sign in to access the simulation
            </Typography>
          </Box>

          {error && (
            <Box
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="Username"
            sx={{ mb: 2 }}
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleLogin()}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            sx={{ mb: 3 }}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleLogin()}
          />
          <Button
            variant="contained"
            fullWidth
            onClick={handleLogin}
            size="large"
            sx={{ mb: 3, py: 1.5 }}
          >
            Sign In
          </Button>

          <Box
            sx={{
              width: '100%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
              mb: 3,
            }}
          />

          <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.8 }}>
            Don't have an account?{' '}
            <Typography
              component={Link}
              to="/register"
              sx={{
                color: '#8B5CF6',
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Register
            </Typography>
          </Typography>
        </Paper>
      </Fade>
    </Container>
  );
}

export default Login;
