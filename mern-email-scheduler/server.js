/* require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
const cors = require('cors');

const app = express();
const port = 5000;

// Use environment variables for API keys
sgMail.setApiKey("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");

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

app.post('/scheduleEmail', async (req, res) => {
    console.log(req.body)
    const { from, to, subject, text, sendAt } = req.body;
    const email = new Email({ from, to, subject, text, sendAt });

    await email.save();

    const sendEmail = () => {
        const messages = to.map(recipient => ({
            to: recipient,
            from,
            subject,
            text
        }));

        sgMail
            .send(messages)
            .then(() => {
                console.log('Emails sent');
            })
            .catch((error) => {
                console.error('Error sending email:', error.response.body.errors);
            });
    };

    const delay = new Date(sendAt) - new Date();
    setTimeout(sendEmail, delay);

    res.send('Email scheduled successfully');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
 */

/* 
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
sgMail.setApiKey("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");

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
 */


require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 5000;

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, 
    port: 587,
    secure: false, 
    auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS  
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
    to: [String], 
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
