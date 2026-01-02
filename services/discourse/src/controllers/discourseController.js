const discourseService = require('../services/discourseService');

class DiscourseController {
  async listChannels(req, res) {
    try {
      const result = await discourseService.listChannels(req.query);
      res.json(result);
    } catch (error) {
      console.error('Error listing channels:', error);
      res.status(500).json({ error: 'Failed to list channels' });
    }
  }

  async getChannel(req, res) {
    try {
      const { id } = req.params;
      const channel = await discourseService.getChannel(id, req.query);

      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      res.json(channel);
    } catch (error) {
      console.error('Error getting channel:', error);
      res.status(500).json({ error: 'Failed to get channel' });
    }
  }

  async createChannel(req, res) {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
      }

      const { name, description, type, zone } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Channel name is required' });
      }

      const validTypes = ['public', 'private', 'sovereign'];
      if (type && !validTypes.includes(type)) {
        return res.status(400).json({
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      const channel = await discourseService.createChannel(req.body, userId);
      res.status(201).json(channel);
    } catch (error) {
      console.error('Error creating channel:', error);
      res.status(500).json({ error: 'Failed to create channel' });
    }
  }

  async createPost(req, res) {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
      }

      const { channelId, content, title, topic } = req.body;

      if (!channelId || !content) {
        return res.status(400).json({
          error: 'Missing required fields: channelId, content'
        });
      }

      const validTopics = ['economic', 'philosophical', 'strategic', 'general'];
      if (topic && !validTopics.includes(topic)) {
        return res.status(400).json({
          error: `Invalid topic. Must be one of: ${validTopics.join(', ')}`
        });
      }

      const post = await discourseService.createPost(req.body, userId);
      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating post:', error);
      if (error.message === 'Channel not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Access denied to private channel') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create post' });
    }
  }
}

module.exports = new DiscourseController();
