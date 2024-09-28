module.exports = (req, res, next) => {
    const { eventId, fullName, email, dateOfBirth, source } = req.body;

    if (!eventId || !fullName || !email || !dateOfBirth || !source) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    next();
};
