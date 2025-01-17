
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // Import UUID for unique identifiers

const app = express();
const port = 5000;

// Use environment variables for API keys
sgMail.setApiKey(process.env.SEND_GRID_KEY);

mongoose.connect('mongodb://localhost:27017/emailScheduler', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(bodyParser.json());
app.use(cors());

const EmailSchema = new mongoose.Schema({
    from: String,
    to: [String], // Support multiple recipients
    subject: String,
    text: String,
    sendAt: Date
});

const Email = mongoose.model('Email', EmailSchema);
app.get("/",(req,res)=>{
    res.send("Server is Running")
})
app.post('/scheduleEmail', async (req, res) => {
    const { from, to, subject, text, sendAt, gap } = req.body;
    const uniqueId = uuidv4(); // Generate a unique identifier
    const email = new Email({ from, to, subject: `${subject}`, text, sendAt });

    await email.save();

    const sendEmail = async (recipient, delay) => {
        const message = {
            to: recipient,
            from,
            subject: `${subject} `,
            text
        };

        setTimeout(async () => {
            try {
                await sgMail.send(message);
                console.log('Email sent to', recipient);
            } catch (error) {
                console.error('Error sending email to', recipient, ':', error.response.body.errors);
            }
        }, delay);
    };

    const recipients = Array.isArray(to) ? to.map(email => email.trim()) : [to.trim()]; // Handle both array and single string
    let delay = 0; // Initial delay in milliseconds

    for (const recipient of recipients) {
        sendEmail(recipient, delay);
        delay += gap * 60000; // Add gap duration between emails
    }

    res.send('Email scheduled successfully');
});

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
