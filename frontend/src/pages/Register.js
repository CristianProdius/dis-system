import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Paper, Box, Fade } from '@mui/material';
import { registerUser } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import LoadingOverlay from '../components/LoadingOverlay';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await registerUser(username, password);
      setSuccess(true);
      setError(null);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Registration failed. Username may already be taken.');
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
              background: 'linear-gradient(90deg, #EC4899, #8B5CF6)',
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
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2))',
                border: '1px solid rgba(236, 72, 153, 0.3)',
              }}
            >
              <PersonAddIcon sx={{ fontSize: 32, color: '#EC4899' }} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Create Account
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
              Join the capitalism simulation
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

          {success && (
            <Box
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CheckCircleIcon sx={{ color: '#10B981' }} />
              <Typography sx={{ color: '#10B981' }} variant="body2">
                Registration successful! Redirecting...
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="Username"
            sx={{ mb: 2 }}
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleRegister()}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            sx={{ mb: 2 }}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleRegister()}
          />
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            sx={{ mb: 3 }}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleRegister()}
          />
          <Button
            variant="contained"
            fullWidth
            onClick={handleRegister}
            size="large"
            sx={{
              mb: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #DB2777 0%, #7C3AED 100%)',
              },
            }}
          >
            Create Account
          </Button>

          <Box
            sx={{
              width: '100%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.3), transparent)',
              mb: 3,
            }}
          />

          <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.8 }}>
            Already have an account?{' '}
            <Typography
              component={Link}
              to="/login"
              sx={{
                color: '#8B5CF6',
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Sign In
            </Typography>
          </Typography>
        </Paper>
      </Fade>
    </Container>
  );
}

export default Register;
