const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// المسارات الخاصة بشؤون الطلبة والإدارة
router.post('/add-student', adminController.addStudent);
router.get('/students', adminController.getAllStudents);
router.post('/add-professor', adminController.addProfessor);
router.get('/professors', adminController.getAllProfessors);
router.post('/add-course', adminController.addCourse);
router.get('/courses', adminController.getAllCourses);
router.get('/report', adminController.getFullReport);

router.get('/excuses', adminController.getPendingExcuses);
router.put('/excuses/:id', adminController.updateExcuseStatus);

module.exports = router;