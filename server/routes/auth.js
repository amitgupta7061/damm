const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { Redis } = require('@upstash/redis');
const User = require('../models/User');

// Initialize Redis from Environment Variables
let redis;
try {
  redis = Redis.fromEnv();
  // Upstash is REST-based, so we ping it to verify the credentials actively work
  redis.ping().then(() => {
     console.log("✅ Upstash Redis Connected");
  }).catch(err => {
     console.error("❌ Upstash Redis Ping Failed. Check credentials in .env.", err.message);
  });
} catch (e) {
  console.warn("⚠️  Upstash Redis not configured. OTP functionality will crash if invoked.");
}

// Nodemailer Transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route POST /api/auth/send-otp
// Generates OTP, saves to Redis, and emails the user
router.post('/send-otp', async (req, res) => {
  try {
    const { email, name, profession, usagePurpose, companyOrSchool } = req.body;
    
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Ensure the email is standard format
    const checkEmail = email.toLowerCase().trim();

    // Generate random 6-digit OTP
    const otp = generateOTP();

    // Storing OTP in Upstash Redis (Key = email, Value = OTP payload)
    // Expires in 300 seconds (5 minutes)
    await redis.setex(`otp:${checkEmail}`, 300, JSON.stringify({
      otp,
      name,
      profession,
      usagePurpose,
      companyOrSchool
    }));

    // Send email via Gmail
    const mailOptions = {
        from: `"CollabDraw" <${process.env.GMAIL_USER}>`,
        to: checkEmail,
        subject: 'Your CollabDraw Login Code',
        text: `Your one-time password is: ${otp}. It will expire in 5 minutes.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2>Welcome to CollabDraw!</h2>
                <p>Your one-time password (OTP) to log in is:</p>
                <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #7c3aed;">
                    ${otp}
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 24px;">This code will expire in 5 minutes.</p>
            </div>
        `
    };

    if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
        const transporter = createTransporter();
        await transporter.sendMail(mailOptions);
        console.log(`✉️  Sent OTP to ${checkEmail}`);
    } else {
        console.log(`⚠️  GMAIL credentials missing. Simulated OTP for ${checkEmail} is: ${otp}`);
    }

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP", details: err.message });
  }
});

// @route POST /api/auth/verify-otp
// Validates OTP against Redis, Upserts MongoDB User, Returns JWT
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

    const checkEmail = email.toLowerCase().trim();

    // Check Redis for the OTP mapping
    const cachedDataStr = await redis.get(`otp:${checkEmail}`);
    if (!cachedDataStr) {
      return res.status(400).json({ error: "OTP expired or invalid email" });
    }

    // Upstash sometimes returns an already parsed object, let's handle both
    const cachedData = typeof cachedDataStr === 'string' ? JSON.parse(cachedDataStr) : cachedDataStr;

    if (cachedData.otp !== otp) {
      return res.status(400).json({ error: "Incorrect OTP" });
    }

    // Valid OTP! Delete it so it can't be reused
    await redis.del(`otp:${checkEmail}`);

    // Upsert User to MongoDB
    let user = await User.findOne({ email: checkEmail });
    
    if (!user) {
        // If it's a new user and they didn't provide registration fields in Step 1,
        // we might have blank fields. But our UI enforces that if it's a new user,
        // they must have filled out the Form before asking for the OTP.
        if (!cachedData.name) {
            return res.status(400).json({ error: "User does not exist. Please use the signup flow." });
        }

        user = new User({
            email: checkEmail,
            name: cachedData.name,
            profession: cachedData.profession || "Unknown",
            usagePurpose: cachedData.usagePurpose || "Unknown",
            companyOrSchool: cachedData.companyOrSchool || ""
        });
        await user.save();
    }

    // Generate JWT
    const payload = {
        userId: user._id,
        email: user.email,
        name: user.name
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

    res.status(200).json({ 
        token, 
        user: payload
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

module.exports = router;
