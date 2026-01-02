const { Channel, Post } = require('../models');
const { Op } = require('sequelize');

class DiscourseService {
  async listChannels(filters = {}) {
    const where = {};

    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.zone) {
      where.zone = filters.zone;
    }
    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Channel.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      channels: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  async getChannel(id, filters = {}) {
    const channel = await Channel.findByPk(id);

    if (!channel) {
      return null;
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    const postWhere = { channelId: id };
    if (filters.topic) {
      postWhere.topic = filters.topic;
    }

    const { count, rows: posts } = await Post.findAndCountAll({
      where: postWhere,
      order: [
        ['isPinned', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
    });

    return {
      ...channel.toJSON(),
      posts,
      postsPagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  async createChannel(data, userId) {
    const channel = await Channel.create({
      name: data.name,
      description: data.description,
      type: data.type || 'public',
      zone: data.zone,
      createdBy: userId,
    });

    return channel.toJSON();
  }

  async createPost(data, userId) {
    const channel = await Channel.findByPk(data.channelId);

    if (!channel) {
      throw new Error('Channel not found');
    }

    if (channel.type === 'private' && channel.createdBy !== userId) {
      throw new Error('Access denied to private channel');
    }

    const post = await Post.create({
      channelId: data.channelId,
      authorId: userId,
      title: data.title,
      content: data.content,
      topic: data.topic || 'general',
      isPinned: data.isPinned || false,
    });

    return post.toJSON();
  }
}

module.exports = new DiscourseService();
