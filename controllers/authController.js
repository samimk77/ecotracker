const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Ward = require('../models/Ward');
const { resolveWardFromCoords } = require('../services/geocodingService');

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, lat, lng, organization, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = new User({ 
      name, 
      email, 
      password, 
      organization: organization || '',
      role: role || 'user'
    });

    // If coordinates provided, resolve ward
    if (lat && lng) {
      user.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
      const wardInfo = await resolveWardFromCoords(parseFloat(lat), parseFloat(lng));
      if (wardInfo) {
        user.ward = wardInfo._id;
        user.wardName = wardInfo.name;
      }
    }


    await user.save();

    const token = signToken(user._id, user.role);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ward: user.wardName,
        stats: user.stats,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user._id, user.role);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        wardName: user.wardName,
        avatar: user.avatar,
        stats: user.stats,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('ward', 'name sustainabilityScore');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const updates = {};
    const allowed = ['name', 'organization'];
    allowed.forEach(field => { if (req.body[field]) updates[field] = req.body[field]; });

    if (req.file) updates.avatar = req.file.path;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      select: '-password',
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile };
