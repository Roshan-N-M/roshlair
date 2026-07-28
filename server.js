/**
 * Roshh Lair - Backend REST API Server
 * Handles contact form submissions with validation, persistence, and logging.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'roshh'))); // Serve static site

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Ensure the data directory and messages.json file exist.
 */
function ensureDataStore() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(MESSAGES_FILE)) {
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
}

/**
 * Validate an email address format.
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sanitize a string by trimming whitespace and removing HTML tags.
 */
function sanitize(str) {
    return String(str || '').trim().replace(/<[^>]*>/g, '');
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * Health check endpoint
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Roshh Lair API is live.' });
});

/**
 * Contact form submission endpoint
 * POST /api/contact
 * Body: { name, email, subject, message }
 */
app.post('/api/contact', (req, res) => {
    try {
        const name = sanitize(req.body.name);
        const email = sanitize(req.body.email);
        const subject = sanitize(req.body.subject);
        const message = sanitize(req.body.message);

        // ── Validation ──────────────────────────────────────────────────────
        const errors = [];

        if (!name || name.length < 2) {
            errors.push('Name must be at least 2 characters.');
        }
        if (name.length > 100) {
            errors.push('Name must be under 100 characters.');
        }

        if (!email) {
            errors.push('Email is required.');
        } else if (!isValidEmail(email)) {
            errors.push('Please provide a valid email address.');
        }

        if (!subject || subject.length < 3) {
            errors.push('Subject must be at least 3 characters.');
        }
        if (subject.length > 200) {
            errors.push('Subject must be under 200 characters.');
        }

        if (!message || message.length < 10) {
            errors.push('Message must be at least 10 characters.');
        }
        if (message.length > 5000) {
            errors.push('Message must be under 5000 characters.');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                errors
            });
        }

        // ── Persist Submission ───────────────────────────────────────────────
        ensureDataStore();

        const submissions = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));

        const entry = {
            id: crypto.randomUUID(),
            name,
            email,
            subject,
            message,
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            receivedAt: new Date().toISOString()
        };

        submissions.push(entry);
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(submissions, null, 2), 'utf-8');

        console.log(`\n[🔥 ROSHH API] New contact message from ${name} <${email}>`);
        console.log(`   ID: ${entry.id}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Received: ${entry.receivedAt}\n`);

        return res.status(200).json({
            success: true,
            message: `Signal received, ${name}! The solo has been fired. Roshh will get back to you soon.`,
            id: entry.id
        });

    } catch (err) {
        console.error('[ROSHH API ERROR]', err);
        return res.status(500).json({
            success: false,
            errors: ['Server error. Please try again later.']
        });
    }
});

/**
 * List all submissions (admin endpoint - protect in production)
 * GET /api/contact/messages
 */
app.get('/api/contact/messages', (req, res) => {
    try {
        // Basic API key protection for the admin endpoint
        const apiKey = req.headers['x-api-key'];
        const expectedKey = process.env.ADMIN_API_KEY;

        if (expectedKey && apiKey !== expectedKey) {
            return res.status(401).json({ success: false, errors: ['Unauthorized.'] });
        }

        ensureDataStore();
        const submissions = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));

        return res.status(200).json({
            success: true,
            count: submissions.length,
            messages: submissions
        });
    } catch (err) {
        console.error('[ROSHH API ERROR]', err);
        return res.status(500).json({ success: false, errors: ['Server error.'] });
    }
});

// ─── Serve Frontend on all non-API routes ─────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'roshh', 'index.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
ensureDataStore();
app.listen(PORT, () => {
    console.log(`\n🔥 Roshh Lair API ignited at http://localhost:${PORT}`);
    console.log(`   POST /api/contact       → Submit contact form`);
    console.log(`   GET  /api/contact/messages → View all submissions (admin)`);
    console.log(`   GET  /api/health        → Health check\n`);
});

module.exports = app;
