const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

async function connect() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment variables.');
  }
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  await mongoose.connect(MONGODB_URI, { dbName: 'sdmodel' });
  console.log('✅ MongoDB connected');
  await seedAdmin();
  await seedTeachers();
}

async function seedAdmin() {
  const { Admin } = require('./models.cjs');

  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name     = process.env.ADMIN_NAME || 'Mrs. Amita Singh';

  if (!email || !password) {
    console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed.');
    return;
  }

  // If email changed (e.g. re-deploy with new creds), find by name or any existing admin
  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) return; // already seeded with this email

  // Remove any stale admin docs before creating the new one
  await Admin.deleteMany({});

  await Admin.create({
    name,
    email:         email.toLowerCase(),
    password_hash: bcrypt.hashSync(password, 10),
  });

  console.log(`🌱 Admin seeded → ${email}`);
}

async function seedTeachers() {
  const crypto     = require('crypto');
  const { Teacher } = require('./models.cjs');
  const TEACHERS   = require('./seed-teachers.cjs');
  const today      = new Date().toISOString().split('T')[0];

  let inserted = 0, updated = 0;
  for (const t of TEACHERS) {
    const exists = await Teacher.findOne({ school_email: t.email });
    if (exists) {
      await Teacher.findByIdAndUpdate(exists._id, {
        name:                   t.name,
        designation:            t.designation,
        phone_number:           t.phone    || exists.phone_number || '',
        subjects_taught:        t.subjects || exists.subjects_taught,
        classes_taught:         t.classes  || exists.classes_taught,
        total_experience_years: t.exp      || exists.total_experience_years,
      });
      updated++;
    } else {
      // Each teacher gets a unique random locked hash — account is unusable
      // until admin clicks "Send All Credentials" which generates + emails a real password
      const lockedHash = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10);
      await Teacher.create({
        name:                   t.name,
        designation:            t.designation,
        school_email:           t.email,
        phone_number:           t.phone    || '',
        password_hash:          lockedHash,
        educational_background: t.qualification || '',
        classes_taught:         t.classes  || [],
        subjects_taught:        t.subjects || [],
        total_experience_years: t.exp      || 0,
        date_joined_school:     today,
        salary_amount:          0,
      });
      inserted++;
    }
  }

  if (inserted > 0 || updated > 0) {
    console.log(`🌱 Teachers: ${inserted} added, ${updated} updated`);
    if (inserted > 0)
      console.log('   → Accounts locked. Admin must click "Send All Credentials" to activate.');
  }
}

module.exports = { connect, seedAdmin, seedTeachers };
