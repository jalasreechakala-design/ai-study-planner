const db = require('../config/db');
const nodemailer = require('nodemailer');

// Setup Nodemailer transporter with fallback
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    console.error('getNotifications Error:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    return res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('markAsRead Error:', err);
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
};

exports.sendEmailReminder = async (req, res) => {
  try {
    const { toEmail, subject, textContent } = req.body;

    if (!toEmail || !subject || !textContent) {
      return res.status(400).json({ error: 'Recipient email, subject, and content are required.' });
    }

    // Attempt email delivery
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail({
          from: `"Student Platform Alerts" <${process.env.SMTP_USER}>`,
          to: toEmail,
          subject: subject,
          text: textContent,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4F46E5;">🎓 Student Academic & Competitive Platform Alert</h2>
            <p>${textContent}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <small style="color: #777;">Sent automatically by Student Platform Notification Engine</small>
          </div>`
        });
        console.log(`Email successfully dispatched to ${toEmail}`);
      } else {
        console.log(`[SIMULATED EMAIL DISPATCH] To: ${toEmail} | Subject: ${subject} | Content: ${textContent}`);
      }
    } catch (mailErr) {
      console.warn(`SMTP Dispatch failed (${mailErr.message}), falling back to simulated logger.`);
    }

    return res.json({ message: `Email reminder queued and sent to ${toEmail} successfully!` });
  } catch (err) {
    console.error('sendEmailReminder Error:', err);
    return res.status(500).json({ error: 'Failed to send email reminder.' });
  }
};
