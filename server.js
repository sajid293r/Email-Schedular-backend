
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 5000;

// Set up Nodemailer transporter using SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // Replace with your SMTP host
    port: process.env.SMTP_PORT, // Use the appropriate port (587 for TLS)
    secure: false, // Set to true if using SSL
    auth: {
        user: process.env.SMTP_USER, // Your SMTP username
        pass: process.env.SMTP_PASS  // Your SMTP password
    }
});

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

app.get("/", (req, res) => {
    res.send("Server is Running");
});
app.post('/scheduleEmail', async (req, res) => {
    console.log(req.body)
    const { from, to, subject, text, sendAt, gap } = req.body;
    const uniqueId = uuidv4();
    const email = new Email({ from, to, subject, text, sendAt });

    await email.save();

    const sendEmail = async (recipient, delay) => {
        const message = {
            from,
            to: recipient,
            subject,
            text
        };

        setTimeout(async () => {
            try {
                await transporter.sendMail(message);
                console.log('Email sent to', recipient);
            } catch (error) {
                console.error('Error sending email to', recipient, ':', error.message);
            }
        }, delay);
    };

    const recipients = Array.isArray(to) ? to.map(email => email.trim()) : [to.trim()];
    let delay = 0;

    for (const recipient of recipients) {
        sendEmail(recipient, delay);
        delay += gap * 60000;
    }

    res.send('Email scheduled successfully');
});

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
