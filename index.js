const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const { v4: uuid } = require('uuid');
const authorize = require('../googleCalendar/services/googleApiAuthService.js');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/create-event', async (req, res) => {
  try {
    const { summary, description, start, end, attendees } = req.body;

    const auth = await authorize();
    const calendar = google.calendar({ version: 'v3', auth });

    // Construct the event object with the specified body structure
    const event = {
      summary: summary || 'Google Meet Meeting',
      location: 'Online',
      description: description || 'A chance to talk with friends.',
      start: { dateTime: start, timeZone: 'GB' },
      end: { dateTime: end, timeZone: 'GB' },
      attendees: attendees.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: uuid(), // Unique request ID
          conferenceSolutionKey: { type: 'hangoutsMeet' },
          status: { statusCode: 'success' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    // Insert the event into the calendar
    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1, // Important to set to enable Meet creation
      sendNotifications: true
    });

    // Get the Google Meet link
    const meetLink = data.hangoutLink;

    res.status(200).json({ message: 'Event created', link: meetLink });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});