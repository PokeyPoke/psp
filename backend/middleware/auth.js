const bcrypt = require('bcryptjs');

const adminAuth = (req, res, next) => {
  if (req.session.isAdmin) {
    return next();
  }
  
  res.status(401).json({ error: 'Admin authentication required' });
};

const authenticate = async (req, res, next) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      return res.status(500).json({ error: 'Admin authentication not configured' });
    }
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }
    
    const isValid = password === adminPassword;
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    req.session.isAdmin = true;
    req.session.adminLoginTime = Date.now();
    
    res.json({ 
      message: 'Admin authenticated successfully',
      session: {
        isAdmin: true,
        loginTime: req.session.adminLoginTime
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

const logout = (req, res) => {
  req.session.isAdmin = false;
  req.session.adminLoginTime = null;
  
  res.json({ message: 'Logged out successfully' });
};

const checkAuthStatus = (req, res) => {
  res.json({
    isAdmin: !!req.session.isAdmin,
    loginTime: req.session.adminLoginTime || null
  });
};

module.exports = {
  adminAuth,
  authenticate,
  logout,
  checkAuthStatus
};