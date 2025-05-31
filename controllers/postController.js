import Post from '../models/post.js';

// إنشاء بوست جديد
export const createPost = async (req, res) => {
  const { content } = req.body;

  try {
    const newPost = await Post.create({
      creator: req.user._id,
      content,
    });

    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
};

// جلب جميع البوستات
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('creator', 'fullName email phone').sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
  }
};

// حذف بوست (بواسطة صاحبه فقط أو أدمن)
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.creator.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await post.deleteOne();
    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete post', error: error.message });
  }
};