const express = require('express');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const { Teacher, Student, Attendance } = require('../database/models.cjs');
const { authenticateToken, requireAdmin } = require('../middleware/auth.cjs');

const router = express.Router();

function generateEmail(name) {
  const parts = name.trim().toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  const first = parts[0] || 'user';
  const last  = parts[parts.length - 1] || first;
  return `${first}.${last}@${process.env.SCHOOL_DOMAIN || 'sdmodelkarnal.edu'}`;
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
  const bytes = crypto.randomBytes(12);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

function safe(t) {
  const obj = t.toObject ? t.toObject() : { ...t };
  delete obj.password_hash;
  obj.id = obj._id.toString();
  return obj;
}

// GET public faculty list — no auth, returns only public-safe fields
router.get('/public', async (req, res) => {
  try {
    const list = await Teacher.find({}, 'name designation subjects_taught classes_taught total_experience_years').sort({ designation: 1, name: 1 });
    res.json(list.map(t => ({
      id:          t._id.toString(),
      name:        t.name,
      designation: t.designation,
      subjects:    t.subjects_taught,
      classes:     t.classes_taught,
      experience:  t.total_experience_years,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET all teachers (authenticated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const list = await Teacher.find().sort({ createdAt: -1 });
    res.json(list.map(safe));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET one teacher
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const t = await Teacher.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Teacher not found' });
    if (req.user.role === 'teacher' && req.user.id !== t._id.toString())
      return res.status(403).json({ error: 'Access denied' });
    res.json(safe(t));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET teacher stats
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'teacher' && req.user.id !== req.params.id)
      return res.status(403).json({ error: 'Access denied' });
    const today = new Date().toISOString().split('T')[0];
    const [totalStudents, att] = await Promise.all([
      Student.countDocuments({ teacher_id: req.params.id }),
      Attendance.find({ teacher_id: req.params.id, date: today }),
    ]);
    res.json({
      totalStudents,
      todayAttendance: [
        { status: 'Present', c: att.filter(a => a.status === 'Present').length },
        { status: 'Absent',  c: att.filter(a => a.status === 'Absent').length  },
      ],
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create teacher (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, date_joined_school, designation } = req.body;
    if (!name || !date_joined_school)
      return res.status(400).json({ error: 'name and date_joined_school required' });

    let school_email = generateEmail(name);
    let base = school_email, n = 1;
    while (await Teacher.findOne({ school_email })) {
      const [local, domain] = base.split('@');
      school_email = `${local}${n++}@${domain}`;
    }

    const plainPassword = generatePassword();
    let classes  = req.body.classes_taught  || '[]';
    let subjects = req.body.subjects_taught || '[]';
    try { classes  = JSON.parse(classes);  } catch { classes  = [classes];  }
    try { subjects = JSON.parse(subjects); } catch { subjects = [subjects]; }

    const teacher = await Teacher.create({
      name:                   name.slice(0, 150),
      age:                    req.body.age ? parseInt(req.body.age) : undefined,
      phone_number:           req.body.phone_number           || undefined,
      personal_email:         req.body.personal_email         || undefined,
      school_email,
      password_hash:          bcrypt.hashSync(plainPassword, 10),
      educational_background: req.body.educational_background || undefined,
      classes_taught:         Array.isArray(classes)  ? classes  : [],
      subjects_taught:        Array.isArray(subjects) ? subjects : [],
      total_experience_years: parseInt(req.body.total_experience_years) || 0,
      date_joined_school,
      salary_amount:          parseFloat(req.body.salary_amount) || 0,
      designation:            designation || 'Teacher',
    });

    res.status(201).json({
      ...safe(teacher),
      generated_password: plainPassword,
      message: 'Teacher created. Share these credentials with the teacher.',
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT update teacher (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const t = await Teacher.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Teacher not found' });

    let classes  = req.body.classes_taught  !== undefined ? req.body.classes_taught  : t.classes_taught;
    let subjects = req.body.subjects_taught !== undefined ? req.body.subjects_taught : t.subjects_taught;
    if (typeof classes  === 'string') { try { classes  = JSON.parse(classes);  } catch { classes  = [classes]; } }
    if (typeof subjects === 'string') { try { subjects = JSON.parse(subjects); } catch { subjects = [subjects]; } }

    const updates = {
      name:                   req.body.name                   || t.name,
      age:                    req.body.age !== undefined ? parseInt(req.body.age) : t.age,
      phone_number:           req.body.phone_number           ?? t.phone_number,
      personal_email:         req.body.personal_email         ?? t.personal_email,
      educational_background: req.body.educational_background ?? t.educational_background,
      classes_taught:         Array.isArray(classes)  ? classes  : t.classes_taught,
      subjects_taught:        Array.isArray(subjects) ? subjects : t.subjects_taught,
      total_experience_years: req.body.total_experience_years !== undefined
        ? parseInt(req.body.total_experience_years) : t.total_experience_years,
      date_joined_school:     req.body.date_joined_school     || t.date_joined_school,
      salary_amount:          req.body.salary_amount !== undefined
        ? parseFloat(req.body.salary_amount) : t.salary_amount,
      designation:            req.body.designation            || t.designation,
    };

    const updated = await Teacher.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(safe(updated));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE teacher (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const t = await Teacher.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ error: 'Teacher not found' });
    await Student.updateMany({ teacher_id: req.params.id }, { $unset: { teacher_id: '' } });
    res.json({ message: 'Teacher deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
