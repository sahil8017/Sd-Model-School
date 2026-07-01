const mongoose = require('mongoose');

// ── Admin ──────────────────────────────────────────────────────────────────
const adminSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
}, { timestamps: true });

// ── Teacher ────────────────────────────────────────────────────────────────
const teacherSchema = new mongoose.Schema({
  name:                   { type: String, required: true, trim: true },
  age:                    Number,
  phone_number:           String,
  personal_email:         String,
  school_email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash:          { type: String, required: true },
  profile_pic_url:        String,
  educational_background: String,
  classes_taught:         { type: [String], default: [] },
  subjects_taught:        { type: [String], default: [] },
  total_experience_years: { type: Number, default: 0 },
  date_joined_school:     String,
  salary_amount:          { type: Number, default: 0 },
  designation:            { type: String, default: 'Teacher' },
}, { timestamps: true });

// ── Student ────────────────────────────────────────────────────────────────
const studentSchema = new mongoose.Schema({
  name:                  { type: String, required: true, trim: true },
  age:                   Number,
  address:               String,
  parent_guardian_phone: { type: String, required: true },
  parent_email:          String,
  class_name:            { type: String, required: true },
  roll_no:               Number,
  overall_grade:         String,
  profile_pic_url:       String,
  teacher_id:            { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', index: true },
}, { timestamps: true });

// ── Attendance ─────────────────────────────────────────────────────────────
const attendanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  date:       { type: String, required: true },
  status:     { type: String, enum: ['Present', 'Absent'], required: true },
}, { timestamps: true });
attendanceSchema.index({ student_id: 1, date: 1 }, { unique: true });

// ── Grade ──────────────────────────────────────────────────────────────────
const gradeSchema = new mongoose.Schema({
  student_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacher_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  subject:        { type: String, required: true },
  marks_obtained: { type: Number, required: true },
  total_marks:    { type: Number, default: 100 },
  exam_type:      String,
}, { timestamps: true });

// ── Email Config (singleton — one row only) ───────────────────────────────
const emailConfigSchema = new mongoose.Schema({
  gmail_user:         { type: String, trim: true },   // e.g. principal@gmail.com
  gmail_app_password: { type: String },               // 16-char Google App Password
  from_name:          { type: String, default: 'S.D. Model Sr. Sec. School' },
  enabled:            { type: Boolean, default: false },
  // Optional Google Sheets integration
  sheets_id:          { type: String },               // Google Sheet ID for attendance export
  sheets_enabled:     { type: Boolean, default: false },
}, { timestamps: true });

module.exports = {
  Admin:       mongoose.model('Admin',       adminSchema),
  Teacher:     mongoose.model('Teacher',     teacherSchema),
  Student:     mongoose.model('Student',     studentSchema),
  Attendance:  mongoose.model('Attendance',  attendanceSchema),
  Grade:       mongoose.model('Grade',       gradeSchema),
  EmailConfig: mongoose.model('EmailConfig', emailConfigSchema),
};
