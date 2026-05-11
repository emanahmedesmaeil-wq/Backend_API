const db = require('../config/db');

const addStudent = async (req, res) => {
    const { student_id, name, password } = req.body;
    
    try {
        const checkQuery = "SELECT * FROM students WHERE student_id = ?";
        const [results] = await db.query(checkQuery, [student_id]);
        
        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'هذا الرقم الجامعي مسجل بالفعل!' });
        }

        const insertQuery = "INSERT INTO students (student_id, name, password) VALUES (?, ?, ?)";
        await db.query(insertQuery, [student_id, name, password]);
        
        res.status(200).json({ success: true, message: 'تم تسجيل الطالب في النظام بنجاح! 🎉' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'خطأ أثناء تسجيل الطالب أو في قاعدة البيانات' });
    }
};

const getAllStudents = async (req, res) => {
    try {
        const [results] = await db.query("SELECT student_id, name FROM students");
        res.status(200).json(results);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'خطأ في جلب الطلاب' });
    }
};

const addProfessor = async (req, res) => {
    const { email, password, name } = req.body;
    
    try {
        const query = "INSERT INTO professors (email, password, name) VALUES (?, ?, ?)";
        await db.query(query, [email, password, name]);
        
        res.status(200).json({ success: true, message: 'تم تسجيل الدكتور بنجاح! 👨‍🏫' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'الإيميل مسجل بالفعل أو حدث خطأ' });
    }
};

const getAllProfessors = async (req, res) => {
    try {
        const [results] = await db.query("SELECT id, name, email FROM professors");
        res.status(200).json(results);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'خطأ في جلب الدكاترة' });
    }
};

const addCourse = async (req, res) => {
    const { course_id, course_name, doctor_name } = req.body;
    
    try {
        const query = "INSERT INTO courses (course_id, course_name, doctor_name) VALUES (?, ?, ?)";
        await db.query(query, [course_id, course_name, doctor_name]);
        
        res.status(200).json({ success: true, message: 'تم إضافة المادة بنجاح! 📚' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'كود المادة مسجل بالفعل أو حدث خطأ' });
    }
};

const getAllCourses = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM courses");
        res.status(200).json(results);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'خطأ في جلب المواد' });
    }
};

const getFullReport = async (req, res) => {
    try {
        const query = `
            SELECT 
                s.name AS student_name,
                c.course_name,
                (SELECT COUNT(*) FROM lectures WHERE course_id = c.course_id) AS total_lectures,
                (
                    (SELECT COUNT(*) FROM attendance a JOIN lectures l ON a.lecture_id = l.lecture_id WHERE a.student_id = s.student_id AND l.course_id = c.course_id) 
                    + 
                    (SELECT COUNT(*) FROM excuses WHERE student_id = s.student_id AND course_id = c.course_id AND status = 'approved')
                ) AS attended_count
            FROM students s
            JOIN courses c
            HAVING total_lectures > 0
        `;
        const [results] = await db.query(query);
        res.status(200).json(results);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'خطأ في توليد التقرير' });
    }
};
// أضف هذه الدوال قبل الـ module.exports مباشرة
const getPendingExcuses = async (req, res) => {
    try {
        const query = `
            SELECT e.excuse_id, e.image_path, e.status, s.name AS student_name, c.course_name 
            FROM excuses e
            JOIN students s ON e.student_id = s.student_id
            JOIN courses c ON e.course_id = c.course_id
            WHERE e.status = 'pending'
        `;
        const [results] = await db.query(query);
        res.status(200).json({ excuses: results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'خطأ في جلب الأعذار' });
    }
};

const updateExcuseStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.query("UPDATE excuses SET status = ? WHERE excuse_id = ?", [status, id]);
        res.status(200).json({ message: 'تم تحديث حالة العذر بنجاح!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'خطأ في التحديث' });
    }
};
const updateManualAttendance = async (req, res) => {
    const { student_id, lecture_id, status } = req.body;
    
    if (!student_id || !lecture_id || !status) {
        return res.status(400).json({ success: false, message: 'الرجاء إدخال جميع البيانات المطلوبة' });
    }

    try {
        if (status === 'حاضر') {
            // التحقق مما إذا كان الطالب مسجلاً بالفعل لتجنب التكرار
            const checkQuery = "SELECT * FROM attendance WHERE student_id = ? AND lecture_id = ?";
            const [results] = await db.query(checkQuery, [student_id, lecture_id]);
            
            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'الطالب مسجل كحاضر بالفعل في هذه المحاضرة' });
            }

            // إضافة الحضور
            const insertQuery = "INSERT INTO attendance (student_id, lecture_id, scan_time) VALUES (?, ?, NOW())";
            await db.query(insertQuery, [student_id, lecture_id]);
            return res.status(200).json({ success: true, message: 'تم تسجيل الحضور يدوياً بنجاح! ✅' });

        } else if (status === 'غائب') {
            // إلغاء الحضور (حذف السجل من جدول attendance)
            const deleteQuery = "DELETE FROM attendance WHERE student_id = ? AND lecture_id = ?";
            const [result] = await db.query(deleteQuery, [student_id, lecture_id]);
            
            if (result.affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'الطالب غير مسجل كحاضر أصلاً لإلغاء حضوره' });
            }
            
            return res.status(200).json({ success: true, message: 'تم تعديل الحالة إلى غائب (إلغاء الحضور) بنجاح! ❌' });
            
        } else {
            return res.status(400).json({ success: false, message: 'حالة غير صالحة' });
        }
    } catch (err) {
        console.error('Manual Update Error:', err);
        return res.status(500).json({ success: false, message: 'خطأ في قاعدة البيانات أثناء التعديل' });
    }
};
module.exports = { 
    addStudent, getAllStudents, addProfessor, getAllProfessors, 
    addCourse, getAllCourses, getFullReport, 
    getPendingExcuses, updateExcuseStatus ,updateManualAttendance
};