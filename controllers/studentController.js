const db = require('../config/db');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'smart_attendance_secret_2026';

const getStudentDashboard = async (req, res) => {
    const student_id = req.params.id;

    try {
        const query = `
            SELECT 
                c.course_id, 
                c.course_name, 
                (SELECT COUNT(*) FROM lectures WHERE course_id = c.course_id) AS total_lectures,
                (
                    (SELECT COUNT(DISTINCT a.id) FROM attendance a JOIN lectures l ON a.lecture_id = l.lecture_id WHERE a.student_id = ? AND l.course_id = c.course_id)
                    +
                    (SELECT COUNT(*) FROM excuses WHERE student_id = ? AND course_id = c.course_id AND status = 'approved')
                ) AS attended_lectures
            FROM courses c
            GROUP BY c.course_id
        `;
        // نمرر student_id مرتين للاستعلام (مرة للحضور ومرة للأعذار)
        const [results] = await db.query(query, [student_id, student_id]);

        const coursesData = results.map(course => {
            const total = course.total_lectures;
            const attended = course.attended_lectures;
            const absent = total - attended;
            
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
                absence_percentage: absencePercentage.toFixed(1) + '%'
            };
        });

        res.status(200).json({
            message: 'تم جلب البيانات بنجاح',
            courses: coursesData
        });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ message: 'خطأ داخلي في السيرفر' });
    }
};

const scanQR = async (req, res) => {
    const { student_id, token } = req.body;

    if (!student_id || !token) {
        return res.status(400).json({ message: 'بيانات غير مكتملة' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { lecture_id, timestamp } = decoded;

        const currentTime = Date.now();
        const timeDifference = currentTime - timestamp;

        if (timeDifference > 15000) {
            return res.status(400).json({ message: 'انتهت صلاحية الكود (تجاوز 15 ثانية)، يرجى مسح الكود الجديد' });
        }

        const checkQuery = 'SELECT * FROM attendance WHERE student_id = ? AND lecture_id = ?';
        const [checkResults] = await db.query(checkQuery, [student_id, lecture_id]);

        if (checkResults.length > 0) {
            return res.status(400).json({ message: 'لقد قمت بتسجيل الحضور مسبقاً في هذه المحاضرة' });
        }

        const insertQuery = 'INSERT INTO attendance (student_id, lecture_id, scan_time) VALUES (?, ?, NOW())';
        await db.query(insertQuery, [student_id, lecture_id]);

        return res.status(200).json({ message: 'تم تسجيل الحضور بنجاح! 🚀' });

    } catch (error) {
        return res.status(400).json({ message: 'رمز QR غير صالح أو مزيف ❌' });
    }
};

const getAttendanceReport = async (req, res) => {
    const { student_id, course_id } = req.query;

    try {
        const totalLecturesQuery = "SELECT COUNT(*) AS total FROM lectures WHERE course_id = ?";
        const [totalResult] = await db.query(totalLecturesQuery, [course_id]);
        const totalLectures = totalResult[0].total;

        if (totalLectures === 0) {
            return res.json({ attendance_percentage: 0, attended_count: 0, total_lectures: 0 });
        }

        const attendedQuery = `
            SELECT COUNT(*) AS attended FROM attendance 
            WHERE student_id = ? AND lecture_id IN (SELECT lecture_id FROM lectures WHERE course_id = ?)
        `;
        const [attendedResult] = await db.query(attendedQuery, [student_id, course_id]);
        
        const attendedCount = attendedResult[0].attended;
        const percentage = (attendedCount / totalLectures) * 100;

        res.status(200).json({
            course_id: course_id,
            total_lectures: totalLectures,
            attended_count: attendedCount,
            absence_count: totalLectures - attendedCount,
            attendance_percentage: percentage.toFixed(2) + "%"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'خطأ في حساب المحاضرات أو حضور الطالب' });
    }
};

const getStudentExcuses = async (req, res) => {
    const studentId = req.params.id;
    try {
        // تم التعديل هنا: الترتيب بـ excuse_id بدل created_at اللي مش موجود
        const query = 'SELECT * FROM excuses WHERE student_id = ? ORDER BY excuse_id DESC';
        const [excuses] = await db.query(query, [studentId]);
        
        res.status(200).json({
            success: true,
            data: excuses
        });
    } catch (err) {
        console.error('Error fetching excuses:', err);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب الأعذار' });
    }
};
const getCourseAttendanceLogs = async (req, res) => {
    const { student_id, course_id } = req.params;

    try {
        // 1. جلب سجلات الحضور الفعلي (عبر QR)
        const attendanceQuery = `
            SELECT a.scan_time AS date, 'حضور' AS status, 'qr' AS type
            FROM attendance a
            JOIN lectures l ON a.lecture_id = l.lecture_id
            WHERE a.student_id = ? AND l.course_id = ?
        `;

        // 2. جلب سجلات الأعذار المقبولة (تعتبر حضور)
        const excusesQuery = `
            SELECT 'عذر مقبول' AS date, 'حضور (عذر)' AS status, 'excuse' AS type
            FROM excuses 
            WHERE student_id = ? AND course_id = ? AND status = 'approved'
        `;

        const [attendanceResults] = await db.query(attendanceQuery, [student_id, course_id]);
        const [excuseResults] = await db.query(excusesQuery, [student_id, course_id]);

        // دمج النتائج وترتيبها
        const allLogs = [...attendanceResults, ...excuseResults];

        res.status(200).json({
            success: true,
            logs: allLogs
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'خطأ في جلب سجلات المادة' });
    }
};
// ضفنا الدالة الجديدة هنا عشان تتصدر بشكل صحيح
module.exports = { 
    getStudentDashboard, 
    scanQR, 
    getAttendanceReport, 
    getStudentExcuses,
    getCourseAttendanceLogs
};``