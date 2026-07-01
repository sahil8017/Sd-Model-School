const express = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { Admin, Teacher } = require('../database/models.cjs');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth.cjs');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const norm = email.trim().toLowerCase();

    // Check admin
    const admin = await Admin.findOne({ email: norm });
    if (admin) {
      const ok = await bcrypt.compare(password, admin.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign(
        { id: admin._id.toString(), role: 'admin', name: admin.name, email: admin.email },
        JWT_SECRET, { expiresIn: '8h' }
      );
      return res.json({ token, role: 'admin', id: admin._id, name: admin.name, email: admin.email });
    }

    // Check teacher
    const teacher = await Teacher.findOne({ school_email: norm });
    if (teacher) {
      const ok = await bcrypt.compare(password, teacher.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign(
        {
          id:             teacher._id.toString(),
          role:           'teacher',
          name:           teacher.name,
          email:          teacher.school_email,
          classes_taught: teacher.classes_taught,
        },
        JWT_SECRET, { expiresIn: '8h' }
      );
      return res.json({
        token, role: 'teacher',
        id:             teacher._id,
        name:           teacher.name,
        email:          teacher.school_email,
        classes_taught: teacher.classes_taught,
      });
    }

    return res.status(401).json({ error: 'No account found for this email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me  — verify token
router.get('/me', authenticateToken, (req, res) => res.json(req.user));

// PUT /api/auth/me  — update admin name / password
router.put('/me', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { name, current_password, new_password } = req.body;
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const updates = {};
    if (name?.trim()) updates.name = name.trim();

    if (new_password) {
      if (!current_password) return res.status(400).json({ error: 'Current password required' });
      const ok = await bcrypt.compare(current_password, admin.password_hash);
      if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
      if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      updates.password_hash = bcrypt.hashSync(new_password, 10);
    }

    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });
    await Admin.findByIdAndUpdate(req.user.id, updates);
    res.json({ message: 'Profile updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
