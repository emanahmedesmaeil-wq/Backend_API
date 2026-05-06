const db = require('../config/db');
const jwt = require('jsonwebtoken');

// مفتاح سري للتشفير (محدش يعرفه غير السيرفر بتاعك)
const SECRET_KEY = 'smart_attendance_secret_2026';

// دالة توليد الـ QR Code للدكتور
const generateQRToken = (req, res) => {
    const lecture_id = req.params.lecture_id;

    // التأكد إن المحاضرة دي موجودة ونشطة الأول
    const query = "SELECT * FROM lectures WHERE lecture_id = ? AND status = 'active'";
    db.query(query, [lecture_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'هذه المحاضرة غير موجودة أو انتهت' });
        }

        // لو المحاضرة شغالة، هنعمل الكود المشفر
        const payload = {
            lecture_id: lecture_id,
            timestamp: Date.now() // بناخد الوقت الحالي بالملي ثانية
        };

        // توليد التوكن
        const token = jwt.sign(payload, SECRET_KEY);

        res.status(200).json({
            message: 'تم توليد الكود بنجاح',
            token: token
        });
    });
};
// دالة بدء محاضرة جديدة
const startLecture = (req, res) => {
    const { course_id } = req.body;
    const date = new Date().toISOString().split('T')[0]; // تاريخ النهارده (YYYY-MM-DD)

    const query = "INSERT INTO lectures (course_id, lecture_date) VALUES (?, ?)";
    
    db.query(query, [course_id, date], (err, result) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ message: 'خطأ في إنشاء المحاضرة' });
        }
        res.status(200).json({ 
            message: 'تم بدء المحاضرة بنجاح', 
            lecture_id: result.insertId // بناخد الـ ID الجديد اللي اتعمل في الداتا بيز
        });
    });
};

// دالة إنهاء المحاضرة (اختياري بس بيقفل الدايرة صح)
const endLecture = (req, res) => {
    // هنا ممكن مستقبلاً نعمل تحديث لحالة المحاضرة في الداتا بيز إنها انتهت
    res.status(200).json({ message: 'تم إنهاء المحاضرة، لا يمكن للطلاب تسجيل الحضور الآن.' });
};
// دالة جلب قائمة المواد للدكتور
// دالة جلب قائمة المواد للدكتور المفتوح حسابه فقط
const getCourses = (req, res) => {
    const { doctor_name } = req.query; // السيرفر هيستقبل اسم الدكتور من المتصفح
    
    const query = "SELECT * FROM courses WHERE doctor_name = ?";
    db.query(query, [doctor_name], (err, results) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ message: 'خطأ في جلب المواد' });
        }
        res.status(200).json(results);
    });
};
// دالة تسجيل دخول الدكتور
const login = (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM professors WHERE email = ? AND password = ?";
    
    db.query(query, [email, password], (err, results) => {
        if (err) return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
        
        if (results.length > 0) {
            // لو البيانات صح، نرجع بيانات الدكتور
            res.status(200).json({ success: true, doctor: results[0] });
        } else {
            res.status(401).json({ success: false, message: 'الإيميل أو كلمة المرور غير صحيحة' });
        }
    });
};


//module.exports = { generateQRToken, SECRET_KEY };
module.exports = { login, generateQRToken, startLecture, endLecture, getCourses };