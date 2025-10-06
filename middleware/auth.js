const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const token = req.cookies && req.cookies.token;
    if (!token) {
        return res.redirect('/user/login');
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.redirect('/user/login');
    }
}

module.exports = authMiddleware;


