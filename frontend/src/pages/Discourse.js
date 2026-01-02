import React, { useState, useEffect } from 'react';
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
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Forum as ForumIcon,
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
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

function Discourse() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelDetails, setChannelDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);

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

  const fetchChannels = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listChannels();
      setChannels(response.data.channels || []);
    } catch (err) {
      setError('Failed to fetch channels');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannelDetails = async (id) => {
    setLoading(true);
    try {
      const response = await getChannel(id);
      setChannelDetails(response.data);
    } catch (err) {
      setError('Failed to fetch channel details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      fetchChannelDetails(selectedChannel);
    }
  }, [selectedChannel]);

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

  if (selectedChannel && channelDetails) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={handleBackToChannels}>
            <BackIcon />
          </IconButton>
          <Typography variant="h5">{channelDetails.name}</Typography>
          <Chip label={channelDetails.type} size="small" color={typeColors[channelDetails.type]} />
          {channelDetails.zone && (
            <Chip label={channelDetails.zone} size="small" variant="outlined" />
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

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {channelDetails.description}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Posts</Typography>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => setCreatePostOpen(true)}
          >
            New Post
          </Button>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : channelDetails.posts?.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No posts yet. Start the discussion!
            </Typography>
          </Paper>
        ) : (
          <List>
            {channelDetails.posts?.map((post, index) => (
              <React.Fragment key={post.id}>
                <ListItem alignItems="flex-start" sx={{ flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, width: '100%' }}>
                    {post.title && (
                      <Typography variant="subtitle1" fontWeight="bold">
                        {post.title}
                      </Typography>
                    )}
                    <Chip
                      label={post.topic}
                      size="small"
                      color={topicColors[post.topic]}
                    />
                    {post.isPinned && (
                      <Chip label="Pinned" size="small" color="warning" />
                    )}
                  </Box>
                  <ListItemText
                    primary={post.content}
                    secondary={`Posted on ${new Date(post.createdAt).toLocaleString()}`}
                  />
                </ListItem>
                {index < channelDetails.posts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ForumIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Discourse & Communication
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchChannels} color="primary">
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
          {channels.map((channel) => (
            <Grid item xs={12} sm={6} md={4} key={channel.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip
                      label={channel.type}
                      size="small"
                      color={typeColors[channel.type]}
                    />
                    {channel.zone && (
                      <Chip label={channel.zone} size="small" variant="outlined" />
                    )}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {channel.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {channel.description || 'No description'}
                  </Typography>
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
          ))}
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
