const db = require('../config/db');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'smart_attendance_secret_2026';

const generateQRToken = async (req, res) => {
    const lecture_id = req.params.lecture_id;

    try {
        const query = "SELECT * FROM lectures WHERE lecture_id = ? AND status = 'active'";
        const [results] = await db.query(query, [lecture_id]);
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'هذه المحاضرة غير موجودة أو انتهت' });
        }

        const payload = {
            lecture_id: lecture_id,
            timestamp: Date.now() 
        };

        const token = jwt.sign(payload, SECRET_KEY);

        res.status(200).json({
            message: 'تم توليد الكود بنجاح',
            token: token
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
    }
};

const startLecture = async (req, res) => {
    const { course_id } = req.body;
    const date = new Date().toISOString().split('T')[0];

    try {
        const query = "INSERT INTO lectures (course_id, lecture_date) VALUES (?, ?)";
        const [result] = await db.query(query, [course_id, date]);
        
        res.status(200).json({ 
            message: 'تم بدء المحاضرة بنجاح', 
            lecture_id: result.insertId 
        });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ message: 'خطأ في إنشاء المحاضرة' });
    }
};

const endLecture = (req, res) => {
    res.status(200).json({ message: 'تم إنهاء المحاضرة، لا يمكن للطلاب تسجيل الحضور الآن.' });
};

const getCourses = async (req, res) => {
    const { doctor_name } = req.query; 
    
    try {
        const query = "SELECT * FROM courses WHERE doctor_name = ?";
        const [results] = await db.query(query, [doctor_name]);
        res.status(200).json(results);
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ message: 'خطأ في جلب المواد' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const query = "SELECT * FROM professors WHERE email = ? AND password = ?";
        const [results] = await db.query(query, [email, password]);
        
        if (results.length > 0) {
            res.status(200).json({ success: true, doctor: results[0] });
        } else {
            res.status(401).json({ success: false, message: 'الإيميل أو كلمة المرور غير صحيحة' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
    }
};

module.exports = { login, generateQRToken, startLecture, endLecture, getCourses };