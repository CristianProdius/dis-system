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
  IconButton,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  ShoppingCart as CartIcon,
  Refresh as RefreshIcon,
  Store as StoreIcon,
  AutoAwesome as PremiumIcon,
} from '@mui/icons-material';
import { listItems, createItem, purchaseItem } from '../services/api';

const categories = ['asset', 'innovation', 'service', 'knowledge'];
const currencies = ['USD', 'EUR', 'BTC', 'GOLD'];

const categoryColors = {
  asset: '#8B5CF6',
  innovation: '#06B6D4',
  service: '#10B981',
  knowledge: '#F59E0B',
};

function Marketplace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filter, setFilter] = useState({ category: '', status: '' });

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: 'asset',
    price: '',
    currency: 'USD',
    isPremium: false,
    tags: '',
  });

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filter.category) params.category = filter.category;
      if (filter.status) params.status = filter.status;

      const response = await listItems(params);
      setItems(response.data.items || []);
    } catch (err) {
      setError('Failed to fetch marketplace items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const handleCreateItem = async () => {
    setError('');
    try {
      const itemData = {
        ...newItem,
        price: parseFloat(newItem.price),
        tags: newItem.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      await createItem(itemData);
      setSuccess('Item created successfully!');
      setCreateDialogOpen(false);
      setNewItem({
        name: '',
        description: '',
        category: 'asset',
        price: '',
        currency: 'USD',
        isPremium: false,
        tags: '',
      });
      fetchItems();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'object' ? detail?.error : detail;
      setError(errorMsg || err.response?.data?.error || 'Failed to create item');
    }
  };

  const handlePurchase = async (itemId) => {
    setError('');
    try {
      await purchaseItem(itemId);
      setSuccess('Purchase successful!');
      fetchItems();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'object' ? detail?.error : detail;
      setError(errorMsg || err.response?.data?.error || 'Failed to purchase item');
    }
  };

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
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <StoreIcon sx={{ fontSize: 28, color: '#8B5CF6' }} />
              </Box>
              <Box>
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
                  Free Market Exchange
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Trade assets, innovations, services, and knowledge
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh">
                <IconButton
                  onClick={fetchItems}
                  sx={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    '&:hover': { background: 'rgba(139, 92, 246, 0.2)' },
                  }}
                >
                  <RefreshIcon sx={{ color: '#8B5CF6' }} />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                List Item
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

          <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filter.category}
                label="Category"
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: categoryColors[cat],
                        }}
                      />
                      {cat}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filter.status}
                label="Status"
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <MenuItem value="">All Items</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="sold">Sold</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 4,
                borderRadius: 3,
                background: theme => theme.palette.mode === 'light'
                  ? 'rgba(139, 92, 246, 0.05)'
                  : 'rgba(139, 92, 246, 0.1)',
                border: '1px dashed rgba(139, 92, 246, 0.3)',
              }}
            >
              <StoreIcon sx={{ fontSize: 48, color: '#8B5CF6', opacity: 0.5, mb: 2 }} />
              <Typography color="text.secondary">
                No items found. Be the first to list something!
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {items.map((item, index) => {
                const isSold = item.status === 'sold';
                const categoryColor = categoryColors[item.category] || '#8B5CF6';
                return (
                  <Grid item xs={12} sm={6} md={4} key={item._id}>
                    <Fade in timeout={400 + index * 50}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          opacity: isSold ? 0.7 : 1,
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: `linear-gradient(90deg, ${categoryColor}, transparent)`,
                          },
                        }}
                      >
                        {isSold && (
                          <Chip
                            label="SOLD"
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              fontWeight: 600,
                              zIndex: 1,
                              background: 'rgba(239, 68, 68, 0.9)',
                              color: '#fff',
                              backdropFilter: 'blur(8px)',
                            }}
                          />
                        )}
                        <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Chip
                              label={item.category}
                              size="small"
                              sx={{
                                bgcolor: `${categoryColor}20`,
                                color: categoryColor,
                                fontWeight: 500,
                                border: `1px solid ${categoryColor}30`,
                              }}
                            />
                            {item.isPremium && (
                              <Chip
                                icon={<PremiumIcon sx={{ fontSize: 14 }} />}
                                label="Premium"
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(245, 158, 11, 0.15)',
                                  color: '#F59E0B',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                              fontWeight: 600,
                              opacity: isSold ? 0.6 : 1,
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ mb: 2, opacity: 0.7, minHeight: 40 }}
                          >
                            {item.description}
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 700,
                              color: isSold ? 'text.disabled' : categoryColor,
                              textDecoration: isSold ? 'line-through' : 'none',
                            }}
                          >
                            {item.price} {item.currency}
                          </Typography>
                          {item.tags && item.tags.length > 0 && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {item.tags.map((tag, i) => (
                                <Chip
                                  key={i}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              ))}
                            </Box>
                          )}
                          {isSold && item.sellerId && (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.6 }}>
                              Sold by: {item.sellerId}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            fullWidth
                            variant={isSold ? "outlined" : "contained"}
                            startIcon={<CartIcon />}
                            onClick={() => handlePurchase(item._id)}
                            disabled={isSold}
                            sx={isSold ? {} : {
                              background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}CC 100%)`,
                              '&:hover': {
                                background: `linear-gradient(135deg, ${categoryColor}CC 0%, ${categoryColor} 100%)`,
                              },
                            }}
                          >
                            {isSold ? 'Sold Out' : 'Purchase'}
                          </Button>
                        </CardActions>
                      </Card>
                    </Fade>
                  </Grid>
                );
              })}
            </Grid>
          )}

          <Dialog
            open={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AddIcon sx={{ color: '#8B5CF6' }} />
                <Typography
                  variant="h6"
                  sx={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  List New Item
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="Name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                  required
                />
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={newItem.category}
                    label="Category"
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <MenuItem key={cat} value={cat}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: categoryColors[cat],
                            }}
                          />
                          {cat}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Price"
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    fullWidth
                    required
                  />
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={newItem.currency}
                      label="Currency"
                      onChange={(e) => setNewItem({ ...newItem, currency: e.target.value })}
                    >
                      {currencies.map(cur => (
                        <MenuItem key={cur} value={cur}>{cur}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <TextField
                  label="Tags (comma separated)"
                  value={newItem.tags}
                  onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                  fullWidth
                  placeholder="quantum, algorithm, patent"
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreateItem}
                variant="contained"
                disabled={!newItem.name || !newItem.description || !newItem.price}
              >
                Create Listing
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
}

export default Marketplace;
