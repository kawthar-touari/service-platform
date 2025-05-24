export const authorizeAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'غير مصرح لك (Admin فقط)' });
  }
  next();
};