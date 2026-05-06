const db = require('../config/db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/excuses/'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('الرجاء رفع ملف صورة فقط'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

const submitExcuse = async (req, res) => {
    const { student_id, course_id } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ message: 'الرجاء إرفاق صورة العذر الطبي' });
    }

    const image_path = '/' + req.file.path.replace(/\\/g, '/');

    try {
        const query = 'INSERT INTO excuses (student_id, course_id, image_path, status) VALUES (?, ?, ?, "pending")';
        await db.query(query, [student_id, course_id, image_path]);
        
        res.status(200).json({ 
            message: 'تم إرسال العذر الطبي بنجاح وبانتظار المراجعة',
            image_url: image_path
        });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ message: 'خطأ أثناء حفظ العذر' });
    }
};

module.exports = { submitExcuse, upload };