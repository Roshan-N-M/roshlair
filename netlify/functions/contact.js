/**
 * Roshh Lair - Netlify Serverless Function
 * Handles contact form POST submissions at /.netlify/functions/contact
 * (proxied from /api/contact via netlify.toml redirects)
 */

const crypto = require('crypto');

/**
 * Sanitize a string value.
 */
function sanitize(str) {
    return String(str || '').trim().replace(/<[^>]*>/g, '');
}

/**
 * Validate an email address.
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ success: false, errors: ['Method not allowed.'] })
        };
    }

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    try {
        let body;
        try {
            body = JSON.parse(event.body || '{}');
        } catch {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: false, errors: ['Invalid JSON body.'] })
            };
        }

        const name = sanitize(body.name);
        const email = sanitize(body.email);
        const subject = sanitize(body.subject);
        const message = sanitize(body.message);

        // ── Validation ──────────────────────────────────────────────────────
        const errors = [];

        if (!name || name.length < 2) errors.push('Name must be at least 2 characters.');
        if (name.length > 100) errors.push('Name must be under 100 characters.');
        if (!email) errors.push('Email is required.');
        else if (!isValidEmail(email)) errors.push('Please provide a valid email address.');
        if (!subject || subject.length < 3) errors.push('Subject must be at least 3 characters.');
        if (subject.length > 200) errors.push('Subject must be under 200 characters.');
        if (!message || message.length < 10) errors.push('Message must be at least 10 characters.');
        if (message.length > 5000) errors.push('Message must be under 5000 characters.');

        if (errors.length > 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: false, errors })
            };
        }

        // ── Build submission payload ─────────────────────────────────────────
        const entry = {
            id: crypto.randomUUID(),
            name,
            email,
            subject,
            message,
            ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown',
            userAgent: event.headers['user-agent'] || 'unknown',
            receivedAt: new Date().toISOString()
        };

        // Log to Netlify function console (visible in Netlify dashboard logs)
        console.log(`[🔥 ROSHH CONTACT] ${entry.receivedAt} | ${name} <${email}> | "${subject}" | ID: ${entry.id}`);

        // ── Success Response ────────────────────────────────────────────────
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: `Signal received, ${name}! The solo has been fired. Roshh will get back to you soon.`,
                id: entry.id
            })
        };

    } catch (err) {
        console.error('[ROSHH FUNCTION ERROR]', err);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, errors: ['Server error. Please try again later.'] })
        };
    }
};
