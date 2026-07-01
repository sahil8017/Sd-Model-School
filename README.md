---
title: SD Model School Management System
emoji: 🏫
colorFrom: red
colorTo: purple
sdk: docker
pinned: false
license: mit
app_port: 7860
---

# S. D. Model Sr. Sec. School, Karnal — Management System

A full-stack school management portal built with **React + TanStack Router** (frontend) and **Node.js / Express + MongoDB Atlas** (backend).

## Features

- 👩‍💼 **Admin Portal** — Teacher directory, salary emails, credentials management
- 👩‍🏫 **Teacher Portal** — Daily attendance, gradebook, parent notifications, notices
- 📧 **Gmail Integration** — Salary, attendance, marks & complaint emails to parents
- 📊 **Google Sheets Export** — CSV attendance export for Google Sheets import
- 🎓 **Auto-generated Students** — Deterministic seeded student data per class

## Environment Variables (set in HuggingFace Space Settings)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string for JWT signing |
| `ADMIN_PASSWORD` | Initial admin password (default: Admin@123) |
| `CORS_ORIGIN` | Set to `*` for HuggingFace Spaces |
| `SCHOOL_NAME` | School name for emails |
| `SCHOOL_DOMAIN` | School email domain |
| `PORT` | Auto-set to 7860 by HuggingFace |

## Login

| Role | Credentials |
|---|---|
| **Admin** | Set via `ADMIN_EMAIL` + `ADMIN_PASSWORD` environment variables |
| **Teachers** | Admin generates & emails credentials via **Teacher Directory → Send All Credentials** |
