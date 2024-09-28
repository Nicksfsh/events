const Event = require('../models/Event');
const EventsLocation = require('../models/EventsLocation');

exports.getLocations = async (req, res) => {
    try {
        const locations = await EventsLocation.find();
        res.json({ locations });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getEvents = async (req, res) => {
    const { page = 1, limit = 8, query = '', location = '', startDate = '', endDate = '' } = req.query;

    const filter = {
        status: 'active'
    };

    if (query.length >= 3) {
        filter.name = { $regex: query, $options: 'i' };
    }

    if (location) {
        filter.locationName = location;
    }

    if (startDate && endDate) {
        const startDateString = new Date(startDate);
        const endDateString = new Date(endDate);
        filter.$or = [
            { startDate: { $gte: startDateString, $lte: endDateString } },
        ];
    }

    const events = await Event.find(filter)
        .sort({ startDate: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const totalEvents = await Event.countDocuments(filter);
    res.json({ events, totalEvents });
};
