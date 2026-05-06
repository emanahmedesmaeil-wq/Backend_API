const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// إعدادات Multer لحفظ الصور في فولدر uploads/excuses
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/excuses/'); // المسار اللي هتتحفظ فيه الصورة
    },
    filename: (req, file, cb) => {
        // تغيير اسم الصورة عشان مفيش صورتين يدخلوا ببعض (رقم عشوائي + وقت + امتداد الصورة)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// فلتر عشان نقبل صور بس
// فلتر ذكي يقبل الصور بناءً على امتداد الملف (عشان نتفادى مشكلة فلاتر)
const fileFilter = (req, file, cb) => {
    // بنجيب امتداد الملف (مثلاً .jpg) ونحوله لحروف صغيرة
    const ext = path.extname(file.originalname).toLowerCase();
    
    // لو الامتداد واحد من دول، اقبله فوراً
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('الرجاء رفع ملف صورة فقط'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// دالة رفع العذر
const submitExcuse = (req, res) => {
    const { student_id, course_id } = req.body;
    
    // التأكد إن الصورة اتبعتت
    if (!req.file) {
        return res.status(400).json({ message: 'الرجاء إرفاق صورة العذر الطبي' });
    }

    const image_path = '/' + req.file.path.replace(/\\/g, '/'); // تعديل شكل المسار عشان يشتغل صح على الويب

    // حفظ البيانات في قاعدة البيانات
    const query = 'INSERT INTO excuses (student_id, course_id, image_path, status) VALUES (?, ?, ?, "pending")';
    db.query(query, [student_id, course_id, image_path], (err, results) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ message: 'خطأ أثناء حفظ العذر' });
        }

        res.status(200).json({ 
            message: 'تم إرسال العذر الطبي بنجاح وبانتظار المراجعة',
            image_url: image_path
        });
    });
};

module.exports = { submitExcuse, upload };