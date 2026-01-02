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
} from '@mui/material';
import {
  Add as AddIcon,
  ShoppingCart as CartIcon,
  Refresh as RefreshIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { listItems, createItem, purchaseItem } from '../services/api';

const categories = ['asset', 'innovation', 'service', 'knowledge'];
const currencies = ['USD', 'EUR', 'BTC', 'GOLD'];

const categoryColors = {
  asset: 'primary',
  innovation: 'secondary',
  service: 'success',
  knowledge: 'warning',
};

function Marketplace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filter, setFilter] = useState({ category: '', status: 'available' });

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <StoreIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Free Market Exchange
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchItems} color="primary">
              <RefreshIcon />
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filter.category}
            label="Category"
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Typography color="text.secondary" align="center">
          No items found. Be the first to list something!
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip
                      label={item.category}
                      size="small"
                      color={categoryColors[item.category] || 'default'}
                    />
                    {item.isPremium && (
                      <Chip label="Premium" size="small" color="warning" variant="outlined" />
                    )}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.description}
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {item.price} {item.currency}
                  </Typography>
                  {item.tags && item.tags.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {item.tags.map((tag, i) => (
                        <Chip key={i} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CartIcon />}
                    onClick={() => handlePurchase(item._id)}
                    disabled={item.status !== 'available'}
                  >
                    {item.status === 'available' ? 'Purchase' : 'Sold'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>List New Item</DialogTitle>
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
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
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
        <DialogActions>
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
    </Container>
  );
}

export default Marketplace;
