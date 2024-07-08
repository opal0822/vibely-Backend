const { validationResult } = require('express-validator/check');
const Post = require('../models/post');
const cloudinary = require('cloudinary').v2;
const User = require('../models/user');


const CLOUD_NAME = process.env.CLOUD_NAME;
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;


cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = req.query.perPage * 1;
  let totalItems;
  Post.find()
    .countDocuments()
    .then(count =>{
      totalItems = count;
      return Post.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
    })
    .then(posts => {
      res
        .status(200)
        .json({ message: 'Fetched posts successfully.', posts: posts, totalItems:totalItems });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed, entered data is incorrect.');
      error.statusCode = 422;
      throw error;
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      const error = new Error('No file uploaded');
      error.statusCode = 422;
      throw error;
    }

    const { title, content } = req.body;
    const file = req.files.image;

    // Upload the image file to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath);

    if (!result || !result.secure_url) {
      const error = new Error('Failed to upload image to Cloudinary');
      error.statusCode = 500;
      throw error;
    }


    const user = await User.findById(req.userId);

    const post = new Post({
      title: title,
      content: content,
      imageUrl: result.secure_url,
      authorName: user.name,
      creator: req.userId
    });

    const savedPost = await post.save();
    
    user.posts.push(savedPost);
    await user.save(); // Save the updated user object

    res.status(201).json({
      message: 'Post created successfully!',
      post: savedPost,
    });
  } catch (error) {
    console.error(error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};



exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: 'Post fetched.', post: post });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};









exports.updatePost = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const { title, content } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    if(post.creator.toString() !== req.userId){
      const error = new Error('You are not authorized to update this post');
      error.statusCode = 403;//status code for authorization issues
      throw error;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed, entered data is incorrect.');
      error.statusCode = 422;
      throw error;
    }

    post.title = title;
    post.content = content;

    // Check if a new image is uploaded
    if (req.files && req.files.image) {
      const file = req.files.image;

      // Upload the new image file to Cloudinary
      const result = await cloudinary.uploader.upload(file.tempFilePath);

      if (!result || !result.secure_url) {
        const error = new Error('Failed to upload image to Cloudinary');
        error.statusCode = 500;
        throw error;
      }

      // Delete the previous image from Cloudinary, if available
      if (post.imageUrl) {
        const previousImageUrl = post.imageUrl;

        // Extract the public_id from the previous image URL
        const publicId = previousImageUrl.split('/').pop().split('.')[0];

        // Delete the previous image using the public_id
        const deletionResult = await cloudinary.uploader.destroy(publicId);

        if (deletionResult.result !== 'ok') {
          const error = new Error('Failed to delete previous image from Cloudinary');
          error.statusCode = 500;
          throw error;
        }
      }

      post.imageUrl = result.secure_url;
    }

    const updatedPost = await post.save();

    res.status(200).json({
      message: 'Post updated successfully!',
      post: updatedPost
    });
  } catch (error) {
    console.error(error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};














exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    if(post.creator.toString() !== req.userId){
      const error = new Error('You are not authorized to delete this post');
      error.statusCode = 403;//status code for authorization issues
      throw error;
    }

    // Delete the image from Cloudinary, if available
    if (post.imageUrl) {
      const imageUrl = post.imageUrl;

      // Extract the public_id from the image URL
      const publicId = imageUrl.split('/').pop().split('.')[0];

      // Delete the image using the public_id
      const deletionResult = await cloudinary.uploader.destroy(publicId);

      if (deletionResult.result !== 'ok') {
        const error = new Error('Failed to delete image from Cloudinary');
        error.statusCode = 500;
        throw error;
      }
    }

    await post.remove();

    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();

    res.status(200).json({ message: 'Post deleted successfully!' });
  } catch (error) {
    console.error(error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};















