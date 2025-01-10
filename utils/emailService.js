const nodemailer = require('nodemailer');

let testAccount = null;

async function createTransporter() {
  // Create test account only if not already created
  if (!testAccount) {
    try {
      testAccount = await nodemailer.createTestAccount();
      console.log('Ethereal Email test account created:', {
        user: testAccount.user,
        pass: testAccount.pass
      });
    } catch (error) {
      console.error('Failed to create Ethereal test account:', error);
      throw new Error('Email service configuration failed');
    }
  }

  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

async function sendResetEmail(email, resetLink) {
  try {
    const transporter = await createTransporter();
    
    const info = await transporter.sendMail({
      from: '"Auth App" <auth@example.com>',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send reset email');
  }
}

module.exports = { sendResetEmail };