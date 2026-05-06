const db = require('../config/db');

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'smart_attendance_secret_2026';

// دالة جلب بيانات المواد ونسبة الغياب للطالب
const getStudentDashboard = (req, res) => {
    // بناخد رقم الطالب من الرابط (URL)
    const student_id = req.params.id;

    // استعلام SQL ذكي بيجيب المواد، ويعد المحاضرات الكلية، ويعد المحاضرات اللي الطالب حضرها
    const query = `
        SELECT 
            c.course_id, 
            c.course_name, 
            COUNT(DISTINCT l.lecture_id) AS total_lectures,
            COUNT(DISTINCT a.id) AS attended_lectures
        FROM courses c
        LEFT JOIN lectures l ON c.course_id = l.course_id
        LEFT JOIN attendance a ON l.lecture_id = a.lecture_id AND a.student_id = ?
        GROUP BY c.course_id
    `;

    db.query(query, [student_id], (err, results) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ message: 'خطأ داخلي في السيرفر' });
        }

        // لوجيك رياضي بسيط لحساب نسبة الغياب
        const coursesData = results.map(course => {
            const total = course.total_lectures;
            const attended = course.attended_lectures;
            const absent = total - attended;
            
            // حساب النسبة المئوية للغياب (عشان الموبايل يعرضها)
            let absencePercentage = 0;
            if (total > 0) {
                absencePercentage = (absent / total) * 100;
            }

            return {
                course_id: course.course_id,
                course_name: course.course_name,
                total_lectures: total,
                attended_lectures: attended,
                absent_lectures: absent,
                absence_percentage: absencePercentage.toFixed(1) + '%' // تقريب النسبة لرقم عشري واحد
            };
        });

        res.status(200).json({
            message: 'تم جلب البيانات بنجاح',
            courses: coursesData
        });
    });
};

// دالة مسح الـ QR وتسجيل الحضور
const scanQR = (req, res) => {
    // الموبايل هيبعت رقم الطالب والتوكن اللي قرأه بالكاميرا
    const { student_id, token } = req.body;

    if (!student_id || !token) {
        return res.status(400).json({ message: 'بيانات غير مكتملة' });
    }

    try {
        // 1. فك التشفير باستخدام المفتاح السري
        const decoded = jwt.verify(token, SECRET_KEY);
        const { lecture_id, timestamp } = decoded;

        // 2. التحقق من الوقت (15 ثانية = 15000 ملي ثانية)
        const currentTime = Date.now();
        const timeDifference = currentTime - timestamp;

        if (timeDifference > 15000) {
            return res.status(400).json({ message: 'انتهت صلاحية الكود (تجاوز 15 ثانية)، يرجى مسح الكود الجديد' });
        }

        // 3. التحقق إذا كان الطالب سجل حضور مسبقاً في نفس المحاضرة (عشان ميسجلش مرتين)
        const checkQuery = 'SELECT * FROM attendance WHERE student_id = ? AND lecture_id = ?';
        db.query(checkQuery, [student_id, lecture_id], (err, results) => {
            if (err) return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });

            if (results.length > 0) {
                return res.status(400).json({ message: 'لقد قمت بتسجيل الحضور مسبقاً في هذه المحاضرة' });
            }

            // 4. لو الكود سليم والوقت سليم والطالب مسجلش قبل كده -> سجل الحضور!
            const insertQuery = 'INSERT INTO attendance (student_id, lecture_id, scan_time) VALUES (?, ?, NOW())';
            db.query(insertQuery, [student_id, lecture_id], (err, insertResult) => {
                if (err) return res.status(500).json({ message: 'خطأ أثناء تسجيل الحضور' });

                return res.status(200).json({ message: 'تم تسجيل الحضور بنجاح! 🚀' });
            });
        });

    } catch (error) {
        // لو التوكن مزيف أو ملعوب فيه
        return res.status(400).json({ message: 'رمز QR غير صالح أو مزيف ❌' });
    }
};
// دالة حساب نسبة حضور طالب في مادة معينة
const getAttendanceReport = (req, res) => {
    const { student_id, course_id } = req.query;

    // 1. نجيب إجمالي عدد المحاضرات اللي اتعملت للمادة دي
    const totalLecturesQuery = "SELECT COUNT(*) AS total FROM lectures WHERE course_id = ?";
    
    db.query(totalLecturesQuery, [course_id], (err, totalResult) => {
        if (err) return res.status(500).json({ message: 'خطأ في حساب المحاضرات' });
        
        const totalLectures = totalResult[0].total;

        if (totalLectures === 0) {
            return res.json({ attendance_percentage: 0, attended_count: 0, total_lectures: 0 });
        }

        // 2. نجيب عدد المرات اللي الطالب ده حضر فيها فعلاً
        const attendedQuery = `
            SELECT COUNT(*) AS attended FROM attendance 
            WHERE student_id = ? AND lecture_id IN (SELECT lecture_id FROM lectures WHERE course_id = ?)
        `;

        db.query(attendedQuery, [student_id, course_id], (err, attendedResult) => {
            if (err) return res.status(500).json({ message: 'خطأ في حساب حضور الطالب' });
            
            const attendedCount = attendedResult[0].attended;
            const percentage = (attendedCount / totalLectures) * 100;

            res.status(200).json({
                course_id: course_id,
                total_lectures: totalLectures,
                attended_count: attendedCount,
                absence_count: totalLectures - attendedCount,
                attendance_percentage: percentage.toFixed(2) + "%" // نسبة الحضور
            });
        });
    });
};

module.exports = { getStudentDashboard, scanQR, getAttendanceReport };