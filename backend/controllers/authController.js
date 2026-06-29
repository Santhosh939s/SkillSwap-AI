const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Zod Validation Schemas
const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    skillsKnown: z.array(z.string()).optional(),
    skillsWanted: z.array(z.string()).optional(),
    securityQuestion: z.string().min(3, 'Security question is required'),
    securityAnswer: z.string().min(1, 'Security answer is required'),
    profilePicture: z.string().optional()
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

// Helper to generate tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
    try {
        // Zod Validation
        const validatedData = registerSchema.parse(req.body);

        let user = await User.findOne({ email: validatedData.email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(validatedData.password, salt);
        const hashedAnswer = await bcrypt.hash(validatedData.securityAnswer.toLowerCase(), salt);

        user = new User({
            ...validatedData,
            password: hashedPassword,
            securityAnswer: hashedAnswer,
            activityLog: [{ action: 'Account created' }]
        });
        
        await user.save();
        res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ msg: err.errors[0].message });
        }
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.login = async (req, res) => {
    try {
        // Zod Validation
        const validatedData = loginSchema.parse(req.body);

        const user = await User.findOne({ email: validatedData.email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(validatedData.password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const { accessToken, refreshToken } = generateTokens(user);
        
        // Save refresh token in DB
        user.refreshToken = refreshToken;
        await user.save();

        // Set HTTP-Only Cookie
        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' requires secure: true
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ token: accessToken });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ msg: err.errors[0].message });
        }
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.jwt;
        if (!refreshToken) return res.status(401).json({ msg: 'Unauthorized' });

        const user = await User.findOne({ refreshToken });
        if (!user) return res.status(403).json({ msg: 'Forbidden' });

        jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
            if (err || user.id !== decoded.id) return res.status(403).json({ msg: 'Forbidden' });
            const accessToken = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
            res.json({ token: accessToken });
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.jwt;
        if (!refreshToken) return res.sendStatus(204); // No content

        // Clear refresh token in DB
        const user = await User.findOne({ refreshToken });
        if (user) {
            user.refreshToken = null;
            await user.save();
        }

        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });
        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
