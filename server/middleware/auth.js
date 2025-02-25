const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    // For now, just check if it's a valid token format
    const token = authHeader.replace('Bearer ', '');
    
    if (!token || token.length < 10) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Store the token in request for later use if needed
    req.adminToken = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = {
  verifyAdmin
}; 