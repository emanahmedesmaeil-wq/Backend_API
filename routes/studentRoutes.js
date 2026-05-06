const express = require('express');
const router = express.Router();

const studentController = require('../controllers/studentController');

// تعريف مسار من نوع GET لجلب بيانات الداش بورد بناءً على رقم الطالب
router.get('/dashboard/:id', studentController.getStudentDashboard);

// مسار مسح الـ QR (POST عشان هنبعت داتا)
router.post('/scan', studentController.scanQR);

const excuseController = require('../controllers/excuseController');
router.post('/excuse', excuseController.upload.single('image'), excuseController.submitExcuse);

module.exports = router;