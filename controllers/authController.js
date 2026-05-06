// استدعاء الاتصال بقاعدة البيانات
const db = require('../config/db');

// دالة تسجيل الدخول
const login = (req, res) => {
    // استلام الرقم الجامعي والباسورد من الموبايل
    const { student_id, password } = req.body;

    // 1. التأكد إن الطالب بعت البيانات أصلاً
    if (!student_id || !password) {
        return res.status(400).json({ message: 'الرجاء إدخال الرقم الجامعي وكلمة المرور' });
    }

    // 2. البحث في قاعدة البيانات عن الطالب ده
    const query = 'SELECT * FROM students WHERE student_id = ? AND password = ?';
    
    db.query(query, [student_id, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'خطأ داخلي في السيرفر' });
        }

        // 3. لو لقينا الطالب (البيانات صحيحة)
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
            // 4. لو ملقيناش الطالب (البيانات غلط)
            return res.status(401).json({ message: 'الرقم الجامعي أو كلمة المرور غير صحيحة' });
        }
    });
};

// تصدير الدالة عشان نستخدمها في ملفات تانية
module.exports = { login };