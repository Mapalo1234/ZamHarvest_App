const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "lwipacaleb4@gmail.com",      
    pass: "bgxkumaplrhvksvg"               
  }
});

module.exports = function sendEmail(to, token) {
  const link = `http://192.168.100.162:3000/verify?token=${token}`;
 
  const mailOptions = {
    from: '"ZamHarvest" <lwipacaleb4@gmail.com>',
    to,
    subject: "Verify your email",
    html: `<p>Click the link to verify your email:</p><a href="${link}">${link}</a>` 
  };

  return transporter.sendMail(mailOptions);
};
