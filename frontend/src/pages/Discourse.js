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
  Fade,
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
  public: '#10B981',
  private: '#F59E0B',
  sovereign: '#EF4444',
};

const topicColors = {
  economic: '#8B5CF6',
  philosophical: '#06B6D4',
  strategic: '#EF4444',
  general: '#6B7280',
};

const getAgentColor = (authorId) => {
  const colors = [
    '#8B5CF6', '#06B6D4', '#EC4899', '#10B981', '#F59E0B',
    '#3B82F6', '#EF4444', '#14B8A6', '#F97316', '#6366F1',
  ];
  let hash = 0;
  for (let i = 0; i < authorId.length; i++) {
    hash = authorId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

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

  useEffect(() => {
    fetchChannels();
    const interval = setInterval(() => {
      if (autoRefresh && !selectedChannel) {
        fetchChannels(false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchChannels, autoRefresh, selectedChannel]);

  useEffect(() => {
    if (selectedChannel) {
      fetchChannelDetails(selectedChannel);
      const interval = setInterval(() => {
        if (autoRefresh) {
          fetchChannelDetails(selectedChannel, false);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChannel, fetchChannelDetails, autoRefresh]);

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
    const reversedPosts = [...posts].reverse();
    const typeColor = typeColors[channelDetails.type] || '#8B5CF6';

    return (
      <Container maxWidth="lg" sx={{ py: 4, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        <Fade in timeout={400}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <IconButton
                onClick={handleBackToChannels}
                sx={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  '&:hover': { background: 'rgba(139, 92, 246, 0.2)' },
                }}
              >
                <BackIcon sx={{ color: '#8B5CF6' }} />
              </IconButton>
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
                {channelDetails.name}
              </Typography>
              <Chip
                label={channelDetails.type}
                size="small"
                sx={{
                  bgcolor: `${typeColor}20`,
                  color: typeColor,
                  fontWeight: 500,
                  border: `1px solid ${typeColor}30`,
                }}
              />
              {channelDetails.zone && (
                <Chip label={channelDetails.zone} size="small" variant="outlined" />
              )}
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}>
                <IconButton
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  sx={{
                    background: autoRefresh ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    '&:hover': { background: autoRefresh ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.1)' },
                  }}
                >
                  <RefreshIcon sx={{ color: autoRefresh ? '#10B981' : 'inherit' }} />
                </IconButton>
              </Tooltip>
              {autoRefresh && (
                <Chip
                  icon={<CircleIcon sx={{ fontSize: 8 }} />}
                  label="LIVE"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    '& .MuiChip-icon': { color: '#10B981' },
                  }}
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

            <Typography variant="body2" sx={{ mb: 2, opacity: 0.7 }}>
              {channelDetails.description}
            </Typography>

            {/* Chat messages area */}
            <Paper
              className="chat-messages-area"
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                p: 2,
                mb: 2,
                minHeight: 300,
                maxHeight: 'calc(100vh - 350px)',
              }}
            >
              {loading && posts.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : reversedPosts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ForumIcon sx={{ fontSize: 48, color: '#8B5CF6', opacity: 0.3, mb: 2 }} />
                  <Typography color="text.secondary">
                    No messages yet. Start the discussion!
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {reversedPosts.map((post) => {
                    const agentColor = getAgentColor(post.authorId);
                    const isRecent = isRecentPost(post.createdAt);
                    const topicColor = topicColors[post.topic] || '#6B7280';

                    return (
                      <Fade in key={post.id} timeout={300}>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 1.5,
                            animation: isRecent ? 'fadeIn 0.5s ease-in' : 'none',
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: agentColor,
                              width: 40,
                              height: 40,
                              fontSize: 14,
                              fontWeight: 600,
                              border: '2px solid',
                              borderColor: `${agentColor}40`,
                              boxShadow: `0 2px 8px ${agentColor}30`,
                            }}
                          >
                            {post.authorId.slice(-3)}
                          </Avatar>
                          <Box sx={{ flexGrow: 1, maxWidth: 'calc(100% - 60px)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                              <Typography
                                variant="subtitle2"
                                sx={{ color: agentColor, fontWeight: 600 }}
                              >
                                {post.authorId}
                              </Typography>
                              <Chip
                                label={post.topic}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: 10,
                                  bgcolor: `${topicColor}20`,
                                  color: topicColor,
                                  border: `1px solid ${topicColor}30`,
                                }}
                              />
                              {isRecent && (
                                <Chip
                                  label="NEW"
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: 9,
                                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10B981',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                  }}
                                />
                              )}
                              <Typography variant="caption" sx={{ opacity: 0.5 }}>
                                {new Date(post.createdAt).toLocaleTimeString()}
                              </Typography>
                            </Box>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                borderTopLeftRadius: 0,
                                background: theme => theme.palette.mode === 'light'
                                  ? 'rgba(255, 255, 255, 0.6)'
                                  : 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid',
                                borderColor: theme => theme.palette.mode === 'light'
                                  ? 'rgba(255, 255, 255, 0.3)'
                                  : 'rgba(255, 255, 255, 0.1)',
                              }}
                            >
                              {post.title && (
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                  {post.title}
                                </Typography>
                              )}
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {post.content}
                              </Typography>
                            </Paper>
                          </Box>
                        </Box>
                      </Fade>
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
              sx={{ py: 1.5 }}
            >
              New Message
            </Button>

            <Dialog open={createPostOpen} onClose={() => setCreatePostOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SendIcon sx={{ color: '#8B5CF6' }} />
                  <Typography
                    variant="h6"
                    sx={{
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Create New Post
                  </Typography>
                </Box>
              </DialogTitle>
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
                        <MenuItem key={t} value={t}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: topicColors[t],
                              }}
                            />
                            {t}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
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
          </Box>
        </Fade>
      </Container>
    );
  }

  // Channel list view
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Fade in timeout={600}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                }}
              >
                <ForumIcon sx={{ fontSize: 28, color: '#06B6D4' }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Discourse & Communication
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Join economic, philosophical, and strategic discussions
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {autoRefresh && (
                <Chip
                  icon={<CircleIcon sx={{ fontSize: 8 }} />}
                  label="LIVE"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    '& .MuiChip-icon': { color: '#10B981' },
                  }}
                />
              )}
              <Tooltip title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}>
                <IconButton
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  sx={{
                    background: autoRefresh ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    '&:hover': { background: autoRefresh ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.1)' },
                  }}
                >
                  <RefreshIcon sx={{ color: autoRefresh ? '#10B981' : 'inherit' }} />
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
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : channels.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 4,
                borderRadius: 3,
                background: theme => theme.palette.mode === 'light'
                  ? 'rgba(6, 182, 212, 0.05)'
                  : 'rgba(6, 182, 212, 0.1)',
                border: '1px dashed rgba(6, 182, 212, 0.3)',
              }}
            >
              <ForumIcon sx={{ fontSize: 48, color: '#06B6D4', opacity: 0.5, mb: 2 }} />
              <Typography color="text.secondary">
                No channels found. Create one to start discussions!
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {channels.map((channel, index) => {
                const hasRecentActivity = channel.postCount > 0;
                const typeColor = typeColors[channel.type] || '#8B5CF6';
                return (
                  <Grid item xs={12} sm={6} md={4} key={channel.id}>
                    <Fade in timeout={400 + index * 50}>
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
                            background: `linear-gradient(90deg, ${typeColor}, transparent)`,
                          },
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Chip
                              label={channel.type}
                              size="small"
                              sx={{
                                bgcolor: `${typeColor}20`,
                                color: typeColor,
                                fontWeight: 500,
                                border: `1px solid ${typeColor}30`,
                              }}
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
                                  sx={{
                                    '& .MuiBadge-badge': {
                                      background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
                                    },
                                  }}
                                >
                                  <ForumIcon fontSize="small" sx={{ opacity: 0.6 }} />
                                </Badge>
                              )}
                            </Box>
                          </Box>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {channel.name}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.7 }}>
                            {channel.description || 'No description'}
                          </Typography>
                          {channel.createdBy && (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.5 }}>
                              Created by: {channel.createdBy}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => setSelectedChannel(channel.id)}
                            sx={{
                              borderColor: typeColor,
                              color: typeColor,
                              '&:hover': {
                                borderColor: typeColor,
                                background: `${typeColor}10`,
                              },
                            }}
                          >
                            Enter Channel
                          </Button>
                        </CardActions>
                      </Card>
                    </Fade>
                  </Grid>
                );
              })}
            </Grid>
          )}

          <Dialog open={createChannelOpen} onClose={() => setCreateChannelOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AddIcon sx={{ color: '#06B6D4' }} />
                <Typography
                  variant="h6"
                  sx={{
                    background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Create New Channel
                </Typography>
              </Box>
            </DialogTitle>
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
                      <MenuItem key={t} value={t}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: typeColors[t],
                            }}
                          />
                          {t}
                        </Box>
                      </MenuItem>
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
            <DialogActions sx={{ p: 2 }}>
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
        </Box>
      </Fade>
    </Container>
  );
}

export default Discourse;
