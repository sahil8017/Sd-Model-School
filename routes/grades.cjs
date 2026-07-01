const express = require('express');
const { Grade, Student, Teacher } = require('../database/models.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

const router = express.Router();

async function enrich(records) {
  const sids = [...new Set(records.map(r => r.student_id?.toString()).filter(Boolean))];
  const tids = [...new Set(records.map(r => r.teacher_id?.toString()).filter(Boolean))];
  const [students, teachers] = await Promise.all([
    Student.find({ _id: { $in: sids } }, 'name class_name'),
    Teacher.find({ _id: { $in: tids } }, 'name'),
  ]);
  const smap = Object.fromEntries(students.map(s => [s._id.toString(), s]));
  const tmap = Object.fromEntries(teachers.map(t => [t._id.toString(), t.name]));
  return records.map(r => ({
    ...r.toObject ? r.toObject() : r,
    id:           r._id.toString(),
    student_name: smap[r.student_id?.toString()]?.name       || '—',
    class_name:   smap[r.student_id?.toString()]?.class_name || '—',
    teacher_name: tmap[r.teacher_id?.toString()]             || '—',
  }));
}

// GET grades
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'teacher') query.teacher_id = req.user.id;
    if (req.query.student_id) query.student_id = req.query.student_id;
    if (req.query.exam_type)  query.exam_type  = req.query.exam_type;
    if (req.query.subject)    query.subject    = req.query.subject;

    const records  = await Grade.find(query).sort({ createdAt: -1 });
    res.json(await enrich(records));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST submit grades (batch)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { grades, teacher_id: body_tid } = req.body;
    if (!Array.isArray(grades) || !grades.length)
      return res.status(400).json({ error: 'grades[] required' });

    const teacher_id = req.user.role === 'teacher' ? req.user.id : (body_tid || null);
    if (!teacher_id) return res.status(400).json({ error: 'teacher_id required for admin' });

    await Grade.insertMany(grades.map(g => ({
      student_id:     g.student_id,
      teacher_id,
      subject:        String(g.subject || '').slice(0, 100),
      marks_obtained: parseFloat(g.marks_obtained),
      total_marks:    parseFloat(g.total_marks) || 100,
      exam_type:      String(g.exam_type || '').slice(0, 50),
    })));

    res.status(201).json({ message: `Grades submitted for ${grades.length} student(s)` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET grades for one student — scoped by ownership
router.get('/student/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      const student = await Student.findById(req.params.id);
      if (!student || student.teacher_id?.toString() !== req.user.id)
        return res.status(403).json({ error: 'Access denied' });
    }
    const records  = await Grade.find({ student_id: req.params.id }).sort({ createdAt: -1 });
    res.json(await enrich(records));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
