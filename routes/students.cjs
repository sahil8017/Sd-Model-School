const express = require('express');
const multer   = require('multer');
const path     = require('path');
const { Student, Teacher } = require('../database/models.cjs');
const { authenticateToken, requireAdmin } = require('../middleware/auth.cjs');

const router = express.Router();

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z]/g, '');
    cb(null, `student_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits:     { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ALLOWED_MIME.has(file.mimetype)),
});

async function withTeacherName(students) {
  const teacherIds = [...new Set(students.map(s => s.teacher_id).filter(Boolean))];
  const teachers   = await Teacher.find({ _id: { $in: teacherIds } }, 'name');
  const tmap       = Object.fromEntries(teachers.map(t => [t._id.toString(), t.name]));
  return students.map(s => ({
    ...s.toObject ? s.toObject() : s,
    id:           s._id.toString(),
    teacher_name: s.teacher_id ? (tmap[s.teacher_id.toString()] || null) : null,
  }));
}

// GET students — teachers see only their own
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'teacher') query.teacher_id = req.user.id;
    if (req.query.class_name)        query.class_name = req.query.class_name;
    const students = await Student.find(query).sort({ class_name: 1, roll_no: 1 });
    res.json(await withTeacherName(students));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET one student
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const s = await Student.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Student not found' });
    if (req.user.role === 'teacher' && s.teacher_id?.toString() !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });
    const [enriched] = await withTeacherName([s]);
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create student — teachers create for their own class
router.post('/', authenticateToken, upload.single('profile_pic'), async (req, res) => {
  try {
    const { name, age, address, parent_guardian_phone, parent_email, class_name, roll_no, teacher_id, overall_grade } = req.body;
    if (!name || !class_name || !parent_guardian_phone)
      return res.status(400).json({ error: 'name, class_name and parent_guardian_phone required' });

    // Teachers always own their own students; admin can assign any teacher
    const tid = req.user.role === 'teacher' ? req.user.id : (teacher_id || null);

    const student = await Student.create({
      name:                  name.slice(0, 150),
      age:                   age ? parseInt(age) : undefined,
      address:               address || undefined,
      parent_guardian_phone: String(parent_guardian_phone).slice(0, 20),
      parent_email:          parent_email || undefined,
      class_name:            String(class_name).slice(0, 30),
      roll_no:               roll_no ? parseInt(roll_no) : undefined,
      overall_grade:         overall_grade || undefined,
      profile_pic_url:       req.file ? `/uploads/${req.file.filename}` : undefined,
      teacher_id:            tid || undefined,
    });
    res.status(201).json({ ...student.toObject(), id: student._id, message: 'Student added' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update student — admin or owning teacher
router.put('/:id', authenticateToken, upload.single('profile_pic'), async (req, res) => {
  try {
    const s = await Student.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Student not found' });
    if (req.user.role === 'teacher' && s.teacher_id?.toString() !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });

    const updates = {
      name:                  req.body.name                  || s.name,
      age:                   req.body.age !== undefined ? parseInt(req.body.age) : s.age,
      address:               req.body.address               ?? s.address,
      parent_guardian_phone: req.body.parent_guardian_phone ?? s.parent_guardian_phone,
      parent_email:          req.body.parent_email          ?? s.parent_email,
      class_name:            req.body.class_name            || s.class_name,
      roll_no:               req.body.roll_no !== undefined ? parseInt(req.body.roll_no) : s.roll_no,
      overall_grade:         req.body.overall_grade         ?? s.overall_grade,
    };
    if (req.file) updates.profile_pic_url = `/uploads/${req.file.filename}`;

    const updated = await Student.findByIdAndUpdate(req.params.id, updates, { new: true });
    const [enriched] = await withTeacherName([updated]);
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE student — admin or owning teacher
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const s = await Student.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Student not found' });
    if (req.user.role === 'teacher' && s.teacher_id?.toString() !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });
    await Student.findByIdAndDelete(req.params.id);
    // Cascade: remove attendance and grades for this student
    const { Attendance, Grade } = require('../database/models.cjs');
    await Promise.all([
      Attendance.deleteMany({ student_id: req.params.id }),
      Grade.deleteMany({ student_id: req.params.id }),
    ]);
    res.json({ message: 'Student deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
