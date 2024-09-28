const puppeteer = require('puppeteer');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const EVENTS_COLLECTION_NAME = process.env.EVENTS_COLLECTION_NAME;
const LOCATIONS_COLLECTION_NAME = process.env.LOCATIONS_COLLECTION_NAME;
const EVENTS_URL = process.env.EVENTS_URL;

if (!MONGODB_URI || !DATABASE_NAME || !EVENTS_COLLECTION_NAME || !EVENTS_URL) {
    console.error('One or more environment variables are missing:');
    console.error(`MONGODB_URI: ${MONGODB_URI}`);
    console.error(`DATABASE_NAME: ${DATABASE_NAME}`);
    console.error(`COLLECTION_NAME: ${EVENTS_COLLECTION_NAME}`);
    console.error(`EVENTS_URL: ${EVENTS_URL}`);
    process.exit(1);
}

async function scrapeEvents() {
    const browser = await puppeteer.launch({ headless: true, protocolTimeout: 1000000 }); // Set { headless: false } for debugging
    const page = await browser.newPage();
    await page.goto(EVENTS_URL, { waitUntil: 'networkidle2' });

    let events = [];

    let previousHeight = 0;
    let scrollDelay = 1000;

    async function extractEvents() {
        const newEvents = await page.evaluate(() => {
            let eventElements = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
            let extractedEvents = [];
            eventElements.forEach(element => {
                let json;
                try {
                    json = JSON.parse(element.innerText);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    return;
                }

                let locationName = json.location && json.location.name ? json.location.name : '';
                let addressLocality = json.location && json.location.address && json.location.address.addressLocality ? json.location.address.addressLocality : '';
                extractedEvents.push({
                    image: json.image || '',
                    name: json.name || '',
                    url: json.url || '',
                    startDate: json.startDate || '',
                    locationName: locationName,
                    addressLocality: addressLocality,
                    status: "active"
                });

            });

            return extractedEvents;
        });

        return newEvents;
    }

    async function autoScroll(page) {
        await page.evaluate(async (scrollDelay) => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, scrollDelay);
            });
        }, scrollDelay);
    }

    async function delay(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time);
        });
    }

    do {
        const newEvents = await extractEvents();

        const uniqueEvents = newEvents.filter((event) => !events.some((e) => e.url === event.url));
        events = [...events, ...uniqueEvents];

        previousHeight = await page.evaluate('document.body.scrollHeight');
        await autoScroll(page);
        await delay(scrollDelay); // Waiting for new elements to load on the page
    } while (await page.evaluate('document.body.scrollHeight') > previousHeight);

   events = events.filter(event => event.url);

    console.log(events);

    await browser.close();

    await insertEventsIntoMongoDB(events);
}

async function insertEventsIntoMongoDB(events) {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const database = client.db(DATABASE_NAME);
        const eventsCollection = database.collection(EVENTS_COLLECTION_NAME);
        const locationsCollection = database.collection(LOCATIONS_COLLECTION_NAME);

        const currentDate = new Date();
        await eventsCollection.updateMany(
            { status: 'active', startDate: { $lt: currentDate } },
            { $set: { status: 'archived' } }
        );

        const allLocations = await locationsCollection.find().toArray();
        console.log('Current locations in the database:', allLocations);

        for (const event of events) {
            const existingEvent = await eventsCollection.findOne({ url: event.url });
            if (!existingEvent) {
                console.log(`Event with URL ${event.url} does not exist in the events collection.`);


                const existingLocation = await locationsCollection.findOne({ locationName: event.locationName });
                if (!existingLocation) {
                    console.log(`Location with name ${event.locationName} does not exist in the locations collection. Inserting new location.`);

                    const insertResult = await locationsCollection.insertOne({
                        addressLocality: event.addressLocality,
                        locationName: event.locationName
                    });
                    console.log(`Inserted new location with name ${event.locationName}, insert result:`, insertResult);
                } else {
                    console.log(`Location with name ${event.locationName} already exists in the locations collection.`);
                }


                if (event.startDate) {
                    event.startDate = new Date(event.startDate);
                }


                await eventsCollection.insertOne(event);
                console.log(`Inserted new event with URL ${event.url}`);
            } else {
                console.log(`Event with URL ${event.url} already exists in the events collection.`);
            }
        }

        console.log(`${events.length} events processed and inserted into the database if not already existing`);
    } catch (error) {
        console.error('Error inserting events into MongoDB:', error);
    } finally {
        await client.close();
    }
}

scrapeEvents();
