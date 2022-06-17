const nodemailer = require("nodemailer");

const sendEmail = (email, subject, url) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      port: "457",
      secure: true,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    console.log("sendemail" + email);
    transporter.sendMail({
      from: process.env.EMAIL_ADDRESS,
      to: email,
      subject: subject,
      html: url,
    });
    console.log("email sent successfully " + email);
  } catch (error) {
    console.log("email not sent!");
    console.log(error);
  }
};
module.exports = sendEmail;
