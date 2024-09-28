const Registration = require('../models/Registration');
const Event = require('../models/Event');

exports.createRegistration = async (req, res) => {
    try {
        const {eventId, fullName, email, dateOfBirth, source} = req.body;

        const existingRegistration = await Registration.findOne({eventId, email});
        if (existingRegistration) {
            return res.json({"existing": true});
        }

        const registration = new Registration({
            eventId,
            fullName,
            email,
            dateOfBirth,
            startDate: (await Event.findById(eventId)).startDate,
            regDate: Date.now() + 3 * 60 * 60 * 1000,
            source
        });
        await registration.save();
        res.status(201).json(registration);
    } catch (error) {
        console.error('Error registering for event:', error);
        res.status(500).json({message: 'Internal server error'});
    }
};

exports.getParticipants = async (req, res) => {
    const {eventId, query = ''} = req.query;
    const filter = query.length >= 3 ? {eventId, fullName: {$regex: query, $options: 'i'}} : {eventId};
    const participants = await Registration.find(filter);
    res.json({participants});
};
