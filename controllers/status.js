const { validationResult } = require('express-validator/check');
const User = require('../models/user');

exports.getStatus = async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      if (user) {
        const userStatus = user.status;
        // Send the user status as a JSON response
        res.status(200).json({ status: userStatus });
      } else {
        // Handle the case when user is not found
        res.status(404).json({ error: 'User not found.' });
      }
    } catch (error) {
      // Handle any errors that occur during the retrieval process
      res.status(500).json({ error: 'Failed to fetch user status.' });
    }
  };

  
  exports.updateStatus = async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: 'Validation failed.', errors: errors.array() });
    }
  
    try {
      // Retrieve the user from the database
      const user = await User.findById(req.userId);
  
      if (user) {
        // Update the user status
        user.status = req.body.status;
        await user.save();
  
        res.status(200).json({ message: 'Status updated successfully.', status: user.status });
      } else {
        // Handle the case when user is not found
        res.status(404).json({ error: 'User not found.' });
      }
    } catch (error) {
      // Handle any errors that occur during the update process
      res.status(500).json({ error: 'Failed to update user status.' });
    }
  };