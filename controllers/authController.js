const db = require('../config/db');

// دالة تسجيل الدخول
const login = async (req, res) => {
    const { student_id, password } = req.body;

    if (!student_id || !password) {
        return res.status(400).json({ message: 'الرجاء إدخال الرقم الجامعي وكلمة المرور' });
    }

    try {
        const query = 'SELECT * FROM students WHERE student_id = ? AND password = ?';
        const [results] = await db.query(query, [student_id, password]);

        if (results.length > 0) {
            const student = results[0];
            return res.status(200).json({
                message: 'تم تسجيل الدخول بنجاح',
                student: {
                    id: student.student_id,
                    name: student.name,
                    level: student.level
                }
            });
        } else {
            return res.status(401).json({ message: 'الرقم الجامعي أو كلمة المرور غير صحيحة' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'خطأ داخلي في السيرفر' });
    }
};

module.exports = { login };