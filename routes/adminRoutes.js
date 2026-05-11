const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// المسارات الأساسية
router.get('/students', adminController.getAllStudents);
router.get('/professors', adminController.getAllProfessors);
router.get('/courses', adminController.getAllCourses);
router.post('/add-student', adminController.addStudent);
router.post('/add-professor', adminController.addProfessor);
router.post('/add-course', adminController.addCourse);
router.get('/report', adminController.getFullReport);

router.get('/excuses', adminController.getPendingExcuses);
router.put('/excuses/:id', adminController.updateExcuseStatus);

router.post('/manual-attendance', adminController.updateManualAttendance);

module.exports = router;