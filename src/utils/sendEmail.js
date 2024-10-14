const nodemailer = require("nodemailer");
const fs = require("fs")
const ejs = require("ejs")


const sesRegion = 'ap-south-1'
// Create a transporter using AWS SES SMTP
const mailTransporter = nodemailer.createTransport({
    host: `email-smtp.${sesRegion}.amazonaws.com`, // AWS SES SMTP endpoint
    port: 465, // Port for TLS/STARTTLS
    secure: true,
    auth: {
        user: "AKIASR2CUTHJJQFFQRXZ",
        pass: "BAclq1i9ou6pVZsj24NWMBEAjftGSGbj2OXu8n6K7kq4"
    }
});

const sendEmail = async (email, data,emailTemplate) => {
  try {

    const template = fs.readFileSync(__dirname + `/email/${emailTemplate}.ejs`, 'utf-8')

        //Render the template with the data and send email notification
        const renderedEmail = ejs.render(template,data)

    const mailOptions = {
      from: '"carril" <info@farmlandbazaar.com>',
      to: email,
      subject: emailTemplate == "forgot" ? "Forgot password" : "Your Login email and Password",
      html : renderedEmail,
      //html: `<h3>Hi, </h3><p>We received a request to reset the password for your account associated with this email address. If you made this request, please click the link below to reset your password <b><a href=${link}>link</a></b> to reset password.</p>`,
    };

    let response = await new Promise((resolve, reject) => {
      mailTransporter.sendMail(mailOptions, function (err, data) {
        if (err) {
          console.error("Error Occurs", err);
          return { status: 0, err: err };
        } else {
          resolve(true);
          return { status: true };
        }
      });
    });

    return response;
  } catch (e) {
    // error(e);
    return e;
  }
};

module.exports = sendEmail;

