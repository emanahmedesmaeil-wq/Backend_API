const express = require('express');
const router = express.Router();

// استدعاء الـ Controller اللي لسه عاملينه
const authController = require('../controllers/authController');

// تعريف مسار الـ POST لتسجيل الدخول
router.post('/login', authController.login);

module.exports = router;