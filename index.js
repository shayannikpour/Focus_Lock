require("./utils.js");

require('dotenv').config();

const express = require('express');
const MongoStore = require('connect-mongo');
const path = require('path');
const nodemailer = require('nodemailer');
const port = process.env.PORT || 3000;
const app = express();

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;

var {database} = include('databaseConnection');

const emailsCollection = database.db(mongodb_database).collection('emails');

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }));
app.use("/css", express.static("./public/styles"));
// app.use("/img", express.static("./public/images"));
app.use("/js", express.static("./public/"));
app.use(express.static(path.join(__dirname, 'styles')));
app.use(express.static(path.join(__dirname, 'scripts')));
app.use("/img", express.static(path.join(__dirname, 'img')));

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/`
})

app.post('/submitEmail', async (req, res) => {
    var email=req.body.email;
    await emailsCollection.insertOne({ email:email });
    try {
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'focuslock2024@gmail.com',
                pass: process.env.EMAIL_PASSWORD
            }
        });
        if (!email) {
            res.render("index");
            return;
        }
        let mailOptions = {
            from: 'focuslock2024@gmail.com',
            to: email,
            subject: 'Robo Rental Launch',
            text:`Exciting news! Robo Rental, the app that makes it easy to rent robots for various services, is launching soon.
            By signing up you will be notified on the day of our apps launch.
            Robo Rental offers a seamless solution for renting robots to assist with a variety of tasks. Stay tuned for more details!

            Thank you for your interest.

            Best regards,

            The Robo Rental Team`,
        };
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        res.redirect('/index2');
    } catch (error) {
        console.error('Error occurred:', error);
    }
});

app.get('/index2', (req, res) => {
    res.render('index2');
});

async function sendAllEmails() {
    try {
        // Fetch email addresses from the collection
        let emails = await emailsCollection.find({}, { projection: { email: 1 } }).toArray();
        console.log("Emails array:", emails);

        // Create a transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'roborental.team@gmail.com',
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Iterate over each email and send the notification
        for (let { email } of emails) {
            console.log("Sending email to:", email);

            // Email options
            let mailOptions = {
                from: 'focuslock2024@gmail.com',
                to: email,
                subject: 'Robo Rental Launched',
                text: `We are thrilled to announce that Robo Rental, the app that makes it easy to rent robots for various services, has officially launched!

With Robo Rental, you can seamlessly rent robots to assist with a variety of tasks, providing you with innovative solutions for your needs. Our app is designed to offer you convenience and efficiency at your fingertips.

Thank you for your interest and support. We invite you to explore the app and discover the future of robotic services.

Stay tuned for more updates and features coming soon!

Best regards,

The Robo Rental Team`
            };

            // Send email
            try {
                let info = await transporter.sendMail(mailOptions);
                console.log('Email sent:', info.messageId);
            } catch (error) {
                console.error('Error sending email:', error);
            }
        }
    } catch (error) {
        console.error('Error fetching emails:', error);
    }
}

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/roborental', (req, res) => {
    res.redirect('https://youtube.com');
});

const sendEmails = process.env.SEND_EMAILS_PAGE_NAME;
app.get("/"+sendEmails, (req, res) => {
    sendAllEmails();
    res.redirect('/');
});

app.listen(port, () => {
    console.log("Node application listening on port " + port);
}); 
