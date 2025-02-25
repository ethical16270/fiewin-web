const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth middleware - headers:', req.headers);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Invalid auth header format:', authHeader);
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header',
        shouldClearStorage: false
      });
    }

    const token = authHeader.split(' ')[1].trim();
    console.log('Extracted token:', token);

    // Store the token in the request object
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      shouldClearStorage: false
    });
  }
};

const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header'
      });
    }

    const token = authHeader.split(' ')[1].trim();
    
    if (token !== 'admin_token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token'
      });
    }

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = { verifyToken, verifyAdmin }; 