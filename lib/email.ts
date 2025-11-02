// Email service using Resend
// Supports transactional emails for notifications

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

let emailService: any = null;
let isEmailConfigured = false;

/**
 * Initialize email service
 */
export function initEmailService() {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️ Resend API key not configured. Email notifications disabled.');
    return;
  }

  try {
    // Dynamic import to avoid bundling in client
    import('resend').then((module) => {
      emailService = new module.Resend(apiKey);
      isEmailConfigured = true;
      console.log('✅ Email service initialized (Resend)');
    });
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error);
  }
}

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!isEmailConfigured || !emailService) {
    console.warn('Email service not configured, skipping email send');
    return false;
  }

  try {
    const result = await emailService.emails.send({
      from: options.from || process.env.EMAIL_FROM || 'SproutShare <noreply@sproutshare.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (result.error) {
      console.error('Email send error:', result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(userEmail: string, username: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #86efac 0%, #22c55e 100%); padding: 30px; text-align: center; color: white; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌿 Welcome to SproutShare!</h1>
          </div>
          <div class="content">
            <p>Hi ${username},</p>
            <p>Welcome to SproutShare! We're excited to have you join our community of plant lovers.</p>
            <p>Get started by:</p>
            <ul>
              <li>Adding your first plant to your collection</li>
              <li>Browsing trades from other plant enthusiasts</li>
              <li>Joining conversations in our forum</li>
            </ul>
            <a href="${process.env.NEXTAUTH_URL}" class="button">Start Exploring</a>
            <p>Happy planting! 🌱</p>
            <p>The SproutShare Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Welcome to SproutShare! 🌿',
    html,
  });
}

/**
 * Send new message notification email
 */
export async function sendMessageNotificationEmail(
  userEmail: string,
  senderUsername: string,
  messagePreview: string,
  conversationUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #86efac 0%, #22c55e 100%); padding: 30px; text-align: center; color: white; }
          .content { padding: 20px; background: #f9fafb; }
          .message-preview { background: white; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 New Message</h1>
          </div>
          <div class="content">
            <p>You have a new message from <strong>${senderUsername}</strong>:</p>
            <div class="message-preview">
              <p>${messagePreview}</p>
            </div>
            <a href="${conversationUrl}" class="button">View Message</a>
            <p>Happy trading! 🌱</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `New message from ${senderUsername} on SproutShare`,
    html,
  });
}

/**
 * Send trade notification email
 */
export async function sendTradeNotificationEmail(
  userEmail: string,
  traderUsername: string,
  tradeDetails: { offeredItem: string; requestedItem: string },
  tradeUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #86efac 0%, #22c55e 100%); padding: 30px; text-align: center; color: white; }
          .content { padding: 20px; background: #f9fafb; }
          .trade-details { background: white; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 New Trade Opportunity</h1>
          </div>
          <div class="content">
            <p><strong>${traderUsername}</strong> has a trade that might interest you:</p>
            <div class="trade-details">
              <p><strong>Offering:</strong> ${tradeDetails.offeredItem}</p>
              <p><strong>Looking for:</strong> ${tradeDetails.requestedItem}</p>
            </div>
            <a href="${tradeUrl}" class="button">View Trade</a>
            <p>Happy trading! 🌱</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `New trade opportunity from ${traderUsername}`,
    html,
  });
}

// Initialize email service on module load (server-side only)
if (typeof window === 'undefined') {
  initEmailService();
}

