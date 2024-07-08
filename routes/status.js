const express = require('express');
const { body } = require('express-validator/check');
const isAuth = require('../middleware/is-auth');

const statusController = require('../controllers/status');

const router = express.Router();

// GET /user/status
router.get('/status', isAuth, statusController.getStatus);

// POST /user/status
router.post('/status', isAuth, [
  body('status').trim().not().isEmpty().withMessage('Status cannot be empty.')
], statusController.updateStatus);

module.exports = router;
