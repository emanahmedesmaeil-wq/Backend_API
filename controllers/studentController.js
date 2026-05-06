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
                COUNT(DISTINCT l.lecture_id) AS total_lectures,
                COUNT(DISTINCT a.id) AS attended_lectures
            FROM courses c
            LEFT JOIN lectures l ON c.course_id = l.course_id
            LEFT JOIN attendance a ON l.lecture_id = a.lecture_id AND a.student_id = ?
            GROUP BY c.course_id
        `;
        const [results] = await db.query(query, [student_id]);

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

module.exports = { getStudentDashboard, scanQR, getAttendanceReport };