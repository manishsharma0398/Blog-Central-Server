const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");

module.exports.sendEmail = asyncHandler(async (data, req, res) => {
  // create reusable transporter object using the default SMTP transport
  const transporter = await nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.MP,
    },
  });

  // send mail with defined transport object
  await transporter.sendMail({
    from: `Blog Central <${process.env.EMAIL_ID}>`, // sender address
    to: data.to, // list of receivers
    subject: data.subject, // Subject line
    text: data.text, // plain text body
    html: data.htm, // html body
  });
});
