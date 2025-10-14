const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "lwipacaleb4@gmail.com",      
    pass: process.env.EMAIL_PASS || "bgxkumaplrhvksvg"               
  }
});

module.exports = function sendEmail(to, token) {
  const baseUrl = process.env.VERIFICATION_BASE_URL || process.env.BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/verify?token=${token}`;
 
  const mailOptions = {
    from: `"ZamHarvest" <${process.env.EMAIL_USER || "lwipacaleb4@gmail.com"}>`,
    to,
    subject: "Verify your email",
    html: `<p>Click the link to verify your email:</p><a href="${link}">${link}</a>` 
  };

  return transporter.sendMail(mailOptions);
};
