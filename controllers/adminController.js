const db = require('../config/db');

// 1. دالة إضافة طالب جديد
const addStudent = (req, res) => {
    const { student_id, name, password } = req.body;
    const checkQuery = "SELECT * FROM students WHERE student_id = ?";
    
    db.query(checkQuery, [student_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'خطأ في قاعدة البيانات' });
        if (results.length > 0) return res.status(400).json({ success: false, message: 'هذا الرقم الجامعي مسجل بالفعل!' });

        const insertQuery = "INSERT INTO students (student_id, name, password) VALUES (?, ?, ?)";
        db.query(insertQuery, [student_id, name, password], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'خطأ أثناء تسجيل الطالب' });
            res.status(200).json({ success: true, message: 'تم تسجيل الطالب في النظام بنجاح! 🎉' });
        });
    });
};

// 2. دالة جلب كل الطلاب
const getAllStudents = (req, res) => {
    db.query("SELECT student_id, name FROM students", (err, results) => {
        if (err) return res.status(500).json({ message: 'خطأ في جلب الطلاب' });
        res.status(200).json(results);
    });
};

// 3. دالة إضافة دكتور جديد
const addProfessor = (req, res) => {
    const { email, password, name } = req.body;
    const query = "INSERT INTO professors (email, password, name) VALUES (?, ?, ?)";
    
    db.query(query, [email, password, name], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'الإيميل مسجل بالفعل أو حدث خطأ' });
        res.status(200).json({ success: true, message: 'تم تسجيل الدكتور بنجاح! 👨‍🏫' });
    });
};

// 4. دالة جلب كل الدكاترة
const getAllProfessors = (req, res) => {
    db.query("SELECT id, name, email FROM professors", (err, results) => {
        if (err) return res.status(500).json({ message: 'خطأ في جلب الدكاترة' });
        res.status(200).json(results);
    });
};
// إضافة مادة جديدة وربطها بدكتور
const addCourse = (req, res) => {
    const { course_id, course_name, doctor_name } = req.body;
    
    const query = "INSERT INTO courses (course_id, course_name, doctor_name) VALUES (?, ?, ?)";
    db.query(query, [course_id, course_name, doctor_name], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'كود المادة مسجل بالفعل أو حدث خطأ' });
        res.status(200).json({ success: true, message: 'تم إضافة المادة بنجاح! 📚' });
    });
};

// جلب كل المواد
const getAllCourses = (req, res) => {
    db.query("SELECT * FROM courses", (err, results) => {
        if (err) return res.status(500).json({ message: 'خطأ في جلب المواد' });
        res.status(200).json(results);
    });
};
// دالة جلب تقرير الغياب الشامل للإدارة
const getFullReport = (req, res) => {
    const query = `
        SELECT 
            s.name AS student_name,
            c.course_name,
            (SELECT COUNT(*) FROM lectures WHERE course_id = c.course_id) AS total_lectures,
            (SELECT COUNT(*) FROM attendance a JOIN lectures l ON a.lecture_id = l.lecture_id WHERE a.student_id = s.student_id AND l.course_id = c.course_id) AS attended_count
        FROM students s
        JOIN courses c
        HAVING total_lectures > 0
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'خطأ في توليد التقرير' });
        res.status(200).json(results);
    });
};

// السطر ده هو اللي كان عامل المشكلة (لازم كل الدوال تتكتب هنا عشان الـ Routes تشوفها)
module.exports = { addStudent, getAllStudents, addProfessor, getAllProfessors, addCourse, getAllCourses, getFullReport };