import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Forum as ForumIcon,
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { listChannels, getChannel, createChannel, createPost } from '../services/api';

const channelTypes = ['public', 'private', 'sovereign'];
const topics = ['economic', 'philosophical', 'strategic', 'general'];

const typeColors = {
  public: 'success',
  private: 'warning',
  sovereign: 'error',
};

const topicColors = {
  economic: 'primary',
  philosophical: 'secondary',
  strategic: 'error',
  general: 'default',
};

// Generate consistent color for agent names
const getAgentColor = (authorId) => {
  const colors = [
    '#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#1565c0',
    '#00838f', '#558b2f', '#e64a19', '#5d4037', '#455a64',
    '#6a1b9a', '#00695c', '#ef6c00', '#4527a0', '#c62828',
  ];
  let hash = 0;
  for (let i = 0; i < authorId.length; i++) {
    hash = authorId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Check if post is recent (within last 60 seconds)
const isRecentPost = (createdAt) => {
  const postTime = new Date(createdAt).getTime();
  const now = Date.now();
  return (now - postTime) < 60000;
};

function Discourse() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelDetails, setChannelDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const messagesEndRef = useRef(null);

  const [newChannel, setNewChannel] = useState({
    name: '',
    description: '',
    type: 'public',
    zone: '',
  });

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    topic: 'general',
  });

  const fetchChannels = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const response = await listChannels();
      setChannels(response.data.channels || []);
    } catch (err) {
      setError('Failed to fetch channels');
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const fetchChannelDetails = useCallback(async (id, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await getChannel(id);
      setChannelDetails(response.data);
    } catch (err) {
      setError('Failed to fetch channel details');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Auto-refresh for channel list
  useEffect(() => {
    fetchChannels();
    const interval = setInterval(() => {
      if (autoRefresh && !selectedChannel) {
        fetchChannels(false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchChannels, autoRefresh, selectedChannel]);

  // Auto-refresh for channel details (posts)
  useEffect(() => {
    if (selectedChannel) {
      fetchChannelDetails(selectedChannel);
      const interval = setInterval(() => {
        if (autoRefresh) {
          fetchChannelDetails(selectedChannel, false);
        }
      }, 3000); // Faster refresh for active channel
      return () => clearInterval(interval);
    }
  }, [selectedChannel, fetchChannelDetails, autoRefresh]);

  // Scroll to bottom when new posts arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [channelDetails?.posts]);

  const handleCreateChannel = async () => {
    setError('');
    try {
      await createChannel(newChannel);
      setSuccess('Channel created successfully!');
      setCreateChannelOpen(false);
      setNewChannel({ name: '', description: '', type: 'public', zone: '' });
      fetchChannels();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'object' ? detail?.error : detail;
      setError(errorMsg || err.response?.data?.error || 'Failed to create channel');
    }
  };

  const handleCreatePost = async () => {
    setError('');
    try {
      await createPost({
        channelId: selectedChannel,
        ...newPost,
      });
      setSuccess('Post created successfully!');
      setCreatePostOpen(false);
      setNewPost({ title: '', content: '', topic: 'general' });
      fetchChannelDetails(selectedChannel);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'object' ? detail?.error : detail;
      setError(errorMsg || err.response?.data?.error || 'Failed to create post');
    }
  };

  const handleBackToChannels = () => {
    setSelectedChannel(null);
    setChannelDetails(null);
  };

  // Channel detail view with chat bubbles
  if (selectedChannel && channelDetails) {
    const posts = channelDetails.posts || [];
    const reversedPosts = [...posts].reverse(); // Show oldest first for chat flow

    return (
      <Container maxWidth="lg" sx={{ py: 4, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton onClick={handleBackToChannels}>
            <BackIcon />
          </IconButton>
          <Typography variant="h5">{channelDetails.name}</Typography>
          <Chip label={channelDetails.type} size="small" color={typeColors[channelDetails.type]} />
          {channelDetails.zone && (
            <Chip label={channelDetails.zone} size="small" variant="outlined" />
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}>
            <IconButton
              onClick={() => setAutoRefresh(!autoRefresh)}
              color={autoRefresh ? "primary" : "default"}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {autoRefresh && (
            <Chip
              icon={<CircleIcon sx={{ fontSize: 10, color: 'success.main' }} />}
              label="LIVE"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
          {channelDetails.description}
        </Typography>

        {/* Chat messages area */}
        <Paper
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 2,
            mb: 2,
            bgcolor: 'grey.50',
            minHeight: 300,
            maxHeight: 'calc(100vh - 350px)',
          }}
        >
          {loading && posts.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : reversedPosts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No messages yet. Start the discussion!
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {reversedPosts.map((post) => {
                const agentColor = getAgentColor(post.authorId);
                const isRecent = isRecentPost(post.createdAt);

                return (
                  <Box
                    key={post.id}
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      animation: isRecent ? 'fadeIn 0.5s ease-in' : 'none',
                      '@keyframes fadeIn': {
                        from: { opacity: 0, transform: 'translateY(10px)' },
                        to: { opacity: 1, transform: 'translateY(0)' },
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: agentColor,
                        width: 36,
                        height: 36,
                        fontSize: 14,
                        fontWeight: 'bold',
                      }}
                    >
                      {post.authorId.slice(-3)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, maxWidth: 'calc(100% - 50px)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: agentColor, fontWeight: 'bold' }}
                        >
                          {post.authorId}
                        </Typography>
                        <Chip
                          label={post.topic}
                          size="small"
                          color={topicColors[post.topic]}
                          sx={{ height: 20, fontSize: 10 }}
                        />
                        {isRecent && (
                          <Chip
                            label="NEW"
                            size="small"
                            color="success"
                            sx={{ height: 18, fontSize: 9 }}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {new Date(post.createdAt).toLocaleTimeString()}
                        </Typography>
                      </Box>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          bgcolor: 'white',
                          borderRadius: 2,
                          borderTopLeftRadius: 0,
                        }}
                      >
                        {post.title && (
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            {post.title}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {post.content}
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>
          )}
        </Paper>

        {/* Post button */}
        <Button
          fullWidth
          variant="contained"
          startIcon={<SendIcon />}
          onClick={() => setCreatePostOpen(true)}
          size="large"
        >
          New Message
        </Button>

        <Dialog open={createPostOpen} onClose={() => setCreatePostOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Title (optional)"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                fullWidth
              />
              <TextField
                label="Content"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                fullWidth
                multiline
                rows={4}
                required
              />
              <FormControl fullWidth>
                <InputLabel>Topic</InputLabel>
                <Select
                  value={newPost.topic}
                  label="Topic"
                  onChange={(e) => setNewPost({ ...newPost, topic: e.target.value })}
                >
                  {topics.map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreatePostOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreatePost}
              variant="contained"
              disabled={!newPost.content}
            >
              Post
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  // Channel list view
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ForumIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Discourse & Communication
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {autoRefresh && (
            <Chip
              icon={<CircleIcon sx={{ fontSize: 10, color: 'success.main' }} />}
              label="LIVE"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
          <Tooltip title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}>
            <IconButton
              onClick={() => setAutoRefresh(!autoRefresh)}
              color={autoRefresh ? "primary" : "default"}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateChannelOpen(true)}
          >
            Create Channel
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : channels.length === 0 ? (
        <Typography color="text.secondary" align="center">
          No channels found. Create one to start discussions!
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {channels.map((channel) => {
            const hasRecentActivity = channel.postCount > 0; // Could enhance with actual recent check
            return (
              <Grid item xs={12} sm={6} md={4} key={channel.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip
                        label={channel.type}
                        size="small"
                        color={typeColors[channel.type]}
                      />
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        {channel.zone && (
                          <Chip label={channel.zone} size="small" variant="outlined" />
                        )}
                        {hasRecentActivity && (
                          <Badge
                            badgeContent={channel.postCount || 0}
                            color="primary"
                            max={99}
                          >
                            <ForumIcon fontSize="small" color="action" />
                          </Badge>
                        )}
                      </Box>
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {channel.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {channel.description || 'No description'}
                    </Typography>
                    {channel.createdBy && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Created by: {channel.createdBy}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setSelectedChannel(channel.id)}
                    >
                      Enter Channel
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={createChannelOpen} onClose={() => setCreateChannelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Channel</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={newChannel.name}
              onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={newChannel.description}
              onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={newChannel.type}
                label="Type"
                onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value })}
              >
                {channelTypes.map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Zone (optional)"
              value={newChannel.zone}
              onChange={(e) => setNewChannel({ ...newChannel, zone: e.target.value })}
              fullWidth
              placeholder="e.g., economics, philosophy"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateChannelOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateChannel}
            variant="contained"
            disabled={!newChannel.name}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Discourse;
