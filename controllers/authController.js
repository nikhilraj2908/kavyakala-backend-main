// controllers/authController.js
const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const crypto = require('crypto');
const { sendMail } = require('../utils/mailer');

// ----- helpers -----
function generateVerificationToken() {
  const raw = crypto.randomBytes(32).toString('hex'); // goes in email link
  const hash = crypto.createHash('sha256').update(raw).digest('hex'); // stored in DB
  return { raw, hash };
}

const EXPIRE_MS = 24 * 60 * 60 * 1000; // 24h
const expiresAt = () => new Date(Date.now() + EXPIRE_MS);

function verificationEmailHTML({ name, link }) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif; line-height:1.6; color:#222;">
    <h2>Welcome to Kavyakala, ${name || 'there'}!</h2>
    <p>Please confirm your email address to activate your account.</p>
    <p style="margin:24px 0;">
      <a href="${link}"
         style="background:#111827;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block">
         Verify Email
      </a>
    </p>
    <p>If the button doesn’t work, paste this link into your browser:</p>
    <p style="word-break:break-all;"><a href="${link}">${link}</a></p>
    <p>This link will expire in 24 hours.</p>
    <hr />
    <p style="font-size:12px;color:#555;">If you didn’t request this, ignore this email.</p>
  </div>`;
}

function buildVerifyLink(req, rawToken) {
  // Prefer .env, otherwise use the current request host/port
  const hostBase = `${req.protocol}://${req.get('host')}`; // e.g. http://localhost:5000
  const apiBase  = process.env.API_BASE_URL || hostBase;   // set API_BASE_URL in .env
  return `${apiBase}/api/auth/verify/${rawToken}`;
}

// ----- controllers -----

// POST /api/auth/signup  (public)
exports.signup = async (req, res) => {
  try {
    const { name, email, handle, password } = req.body;
    if (!name || !email || !handle || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const emailL = email.toLowerCase();
    const handleL = handle.toLowerCase();

    // If user exists, handle verified vs unverified
    const exists = await User.findOne({ $or: [{ email: emailL }, { handle: handleL }] })
      .select('+verificationTokenHash +verificationTokenExpires');

    if (exists) {
      if (exists.isVerified) {
        return res.status(409).json({ message: 'Email or handle already in use' });
      }
      // Unverified: refresh token + re-send email
      const { raw, hash } = generateVerificationToken();
      exists.verificationTokenHash = hash;
      exists.verificationTokenExpires = expiresAt();
      await exists.save();

      const verifyLink = buildVerifyLink(req, raw);
      try {
        await sendMail({
          to: exists.email,
          subject: 'Verify your email',
          text: `Welcome back! Please verify your email: ${verifyLink}`,
          html: verificationEmailHTML({ name: exists.name, link: verifyLink }),
        });
      } catch (e) {
        console.error('sendMail (resend during signup) error:', e?.message || e);
      }

      return res.status(200).json({
        message: 'Account exists but is not verified. A new verification email has been sent.',
        needsVerification: true
      });
    }

    // Create brand-new UNVERIFIED user
    const user = await User.create({
      name,
      email: emailL,
      handle: handleL,
      password,
      role: 'user',
      isVerified: false,
    });

    // Generate + store verification token (24h)
    const { raw, hash } = generateVerificationToken();
    user.verificationTokenHash = hash;
    user.verificationTokenExpires = expiresAt();
    await user.save();

    // Build verify link and send email
    const verifyLink = buildVerifyLink(req, raw);
    try {
      await sendMail({
        to: user.email,
        subject: 'Verify your email',
        text: `Welcome! Please verify your email: ${verifyLink}`,
        html: verificationEmailHTML({ name: user.name, link: verifyLink }),
      });
      return res.status(201).json({
        message: 'Signup successful. Check your email to verify your account.',
        emailSent: true
      });
    } catch (e) {
      console.error('sendMail error:', e?.message || e);
      // User is created with token; they can use "Resend verification"
      return res.status(201).json({
        message: 'Account created, but email could not be sent. Use "Resend verification".',
        emailSent: false
      });
    }
  } catch (err) {
    console.error('signup error:', err);
    res.status(500).json({ message: 'Signup failed' });
  }
};

// POST /api/auth/login  (public)
exports.login = async (req, res) => {
  try {
    const { emailOrHandle, password } = req.body;
    if (!emailOrHandle || !password) return res.status(400).json({ message: 'Missing credentials' });

    const key = emailOrHandle.toLowerCase();

    const user = await User.findOne({
      $or: [{ email: key }, { handle: key }]
    }).select('+password');

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ message: 'Account disabled' });

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Email not verified. Please verify to continue.',
        needsVerification: true
      });
    }

    const token = signToken({ id: user._id, role: user.role });

    res.json({
      token,
      user: { id: user._id, name: user.name, handle: user.handle, role: user.role }
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

// GET /api/auth/verify/:token  (public)
exports.verifyEmail = async (req, res) => {
  try {
    const raw = req.params.token;
    if (!raw) return res.status(400).send('Missing token.');

    const hash = crypto.createHash('sha256').update(raw).digest('hex');

    const user = await User.findOne({
      verificationTokenHash: hash,
      verificationTokenExpires: { $gt: new Date() },
    }).select('+verificationTokenHash +verificationTokenExpires');

    if (!user) {
      return res.status(400).send('Verification link is invalid or has expired.');
    }

    user.isVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Auto-login: sign JWT and redirect to frontend callback
    const token = signToken({ id: user._id.toString(), role: user.role });

    const appUrl = process.env.APP_BASE_URL || 'http://localhost:8080'; // your app runs on 8080
    const next = encodeURIComponent(req.query.next || '/');

    // Put token in hash so it doesn't leak via Referer headers
    const redirectUrl = `${appUrl}/auth/callback?verified=1&next=${next}#token=${encodeURIComponent(token)}`;

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error('verifyEmail error:', err);
    return res.status(500).send('Server error.');
  }
};

// POST /api/auth/resend-verification  (public)
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+verificationTokenHash +verificationTokenExpires');
    if (!user) return res.status(404).json({ message: 'No account found with that email' });

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified' });
    }

    const { raw, hash } = generateVerificationToken();
    user.verificationTokenHash = hash;
    user.verificationTokenExpires = expiresAt();
    await user.save();

    const link = buildVerifyLink(req, raw);

    try {
      await sendMail({
        to: user.email,
        subject: 'Verify your email (resend)',
        text: `Please verify your email: ${link}`,
        html: verificationEmailHTML({ name: user.name, link }),
      });
      return res.json({ message: 'Verification email sent.' });
    } catch (e) {
      console.error('sendMail (resend) error:', e?.message || e);
      return res.status(200).json({
        message: 'Verification token refreshed, but email could not be sent. Try again later.'
      });
    }
  } catch (err) {
    console.error('resendVerification error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/me  (auth)
exports.me = async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json({ id: user._id, name: user.name, handle: user.handle, role: user.role });
};

// POST /api/auth/admin/create-subadmin  (admin only)
exports.createSubadmin = async (req, res) => {
  const { name, email, handle, password } = req.body;
  if (!name || !email || !handle || !password)
    return res.status(400).json({ message: 'All fields are required' });

  const emailL = email.toLowerCase();
  const handleL = handle.toLowerCase();

  const exists = await User.findOne({ $or: [{ email: emailL }, { handle: handleL }] });
  if (exists) return res.status(409).json({ message: 'Email or handle already in use' });

  const sub = await User.create({
    name,
    email: emailL,
    handle: handleL,
    password,
    role: 'subadmin',
    isVerified: true, // subadmins bypass email verification
  });

  res.status(201).json({ id: sub._id, name: sub.name, handle: sub.handle, role: sub.role });
};

// GET /api/auth/admin/users  (admin only)
exports.listUsers = async (_req, res) => {
  const users = await User.find().select('name email handle role isActive createdAt').sort({ createdAt: -1 });
  res.json(users);
};
