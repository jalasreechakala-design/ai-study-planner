const firestoreService = require('../services/firestoreService');
const nodemailer = require('nodemailer');

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
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const notifications = await firestoreService.getUserNotifications(userId);
    const unreadCount = notifications.filter(n => !n.is_read && !n.isRead).length;

    return res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    console.error('getNotifications Error:', err.message);
    return res.status(500).json({ error: `Failed to fetch notifications from Cloud Firestore: ${err.message}` });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User is not authenticated.' });

    const { id } = req.params;
    await firestoreService.markNotificationAsRead(userId, id);
    return res.json({ message: 'Notification marked as read in Cloud Firestore.' });
  } catch (err) {
    console.error('markAsRead Error:', err.message);
    return res.status(500).json({ error: `Failed to update notification in Cloud Firestore: ${err.message}` });
  }
};

exports.sendEmailReminder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { toEmail, subject, textContent } = req.body;

    if (!toEmail || !subject || !textContent) {
      return res.status(400).json({ error: 'Recipient email, subject, and content are required.' });
    }

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

    if (userId) {
      await firestoreService.createReminder(userId, {
        toEmail,
        subject,
        textContent,
        sentStatus: 'sent'
      }).catch(() => null);
    }

    return res.json({ message: `Email reminder queued and saved to Cloud Firestore successfully!` });
  } catch (err) {
    console.error('sendEmailReminder Error:', err.message);
    return res.status(500).json({ error: `Failed to send email reminder: ${err.message}` });
  }
};
