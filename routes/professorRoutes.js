const express = require('express');
const router = express.Router();

const professorController = require('../controllers/professorController');

// تعريف مسار توليد الـ QR (هياخد رقم المحاضرة في الرابط)
router.get('/generate-qr/:lecture_id', professorController.generateQRToken);

router.post('/start-lecture', professorController.startLecture);
router.post('/end-lecture', professorController.endLecture);
router.get('/courses', professorController.getCourses);
router.post('/login', professorController.login);

module.exports = router;