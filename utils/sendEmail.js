const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"101 Support" <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;text-align:center;">
        <h2 style="color: #303030ff;font-size:31px;">${options.subject}</h2>
        <p style="font-size:21px;line-height:42px;">${options.text}</p>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">This is an automatic message from 101. Please do not reply to it.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
