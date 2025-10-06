module.exports = function requireTrainer(req, res, next) {
  if (!req.user || req.user.role !== 'trainer') {
    return res.status(403).json({ success: false, error: 'Trainer role required' });
  }
  next();
};


