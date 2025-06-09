import nodemailer from "nodemailer";
import { secureLogger } from "@/lib/secure-logger";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      const config: EmailConfig = {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER || "",
          pass: process.env.SMTP_PASSWORD || "",
        },
      };

      this.transporter = nodemailer.createTransport(config);
    } catch (error) {
      secureLogger.error("Email transporter initialization failed", error);
      this.transporter = null;
    }
  }

  private logTransporterError() {
    secureLogger.error("Email transporter not initialized - email sending disabled");
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    if (!this.transporter) {
      this.logTransporterError();
      return false;
    }

    try {
      await this.transporter.sendMail(data);
      secureLogger.info("Email sent successfully", {
        to: data.to,
        subject: data.subject
      });
      return true;
    } catch (error) {
      secureLogger.error("Email sending failed", error, {
        action: "email_send"
      });
      return false;
    }
  }

  // Order confirmation email
  async sendOrderConfirmation(
    email: string,
    orderNumber: string,
    orderTotal: number,
    items: Array<{ productName: string; planName: string; price: number }>,
  ): Promise<boolean> {
    const itemsList = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            ${item.productName} - ${item.planName}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            $${item.price.toFixed(2)}
          </td>
        </tr>
      `,
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - EaseSubs</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Order Confirmed!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">Order Details</h2>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Total Amount:</strong> $${orderTotal.toFixed(2)}</p>
          
          <h3 style="color: #333; margin-top: 30px;">Items Purchased</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background: #667eea; color: white;">
                <th style="padding: 12px; text-align: left;">Product</th>
                <th style="padding: 12px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #333;">What's Next?</h3>
            <p>Your subscriptions are now active! You can access them from your dashboard:</p>
            <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Dashboard</a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #333; color: white;">
          <p style="margin: 0;">If you have any questions, contact us at support@easesubs.com</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Order Confirmation - EaseSubs
      
      Thank you for your purchase!
      
      Order Number: ${orderNumber}
      Total Amount: $${orderTotal.toFixed(2)}
      
      Items Purchased:
      ${items.map((item) => `- ${item.productName} - ${item.planName}: $${item.price.toFixed(2)}`).join("\n")}
      
      Your subscriptions are now active! Access them at: ${process.env.NEXTAUTH_URL}/dashboard
      
      Questions? Contact us at support@easesubs.com
    `;

    return this.sendEmail({
      to: email,
      subject: `Order Confirmation - ${orderNumber}`,
      html,
      text,
    });
  }

  // Welcome email for new users
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to EaseSubs</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to EaseSubs!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your journey to affordable subscriptions starts here</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">Hi ${name}!</h2>
          <p>Thank you for joining EaseSubs. We're excited to help you save up to 80% on your favorite subscriptions.</p>
          
          <div style="margin: 30px 0; padding: 20px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #333;">Get Started</h3>
            <p>Explore our catalog of premium subscriptions at discounted prices:</p>
            <a href="${process.env.NEXTAUTH_URL}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Browse Subscriptions</a>
          </div>
          
          <div style="margin: 30px 0; padding: 20px; background: white; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #333;">Need Help?</h3>
            <p>Our support team is here to help you with any questions:</p>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/support" style="color: #667eea; text-decoration: none;">Create Support Ticket</a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #333; color: white;">
          <p style="margin: 0;">Questions? Reply to this email or contact support@easesubs.com</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to EaseSubs!
      
      Hi ${name}!
      
      Thank you for joining EaseSubs. We're excited to help you save up to 80% on your favorite subscriptions.
      
      Get started by browsing our subscriptions: ${process.env.NEXTAUTH_URL}
      
      Need help? Contact us at support@easesubs.com
    `;

    return this.sendEmail({
      to: email,
      subject: "Welcome to EaseSubs - Start Saving Today!",
      html,
      text,
    });
  }

  // Password reset email
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<boolean> {
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - EaseSubs</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Password Reset</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Reset your EaseSubs password</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 8px; border-left: 4px solid #ff6b6b;">
            <h3 style="margin-top: 0; color: #333;">Important Security Note</h3>
            <p style="margin-bottom: 0;">This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #333; color: white;">
          <p style="margin: 0;">If you're having trouble clicking the button, copy and paste this URL: ${resetUrl}</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset - EaseSubs
      
      We received a request to reset your password.
      
      Click this link to reset your password: ${resetUrl}
      
      This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
      
      Questions? Contact us at support@easesubs.com
    `;

    return this.sendEmail({
      to: email,
      subject: "Reset Your EaseSubs Password",
      html,
      text,
    });
  }

  // Support ticket notification
  async sendSupportTicketEmail(
    email: string,
    ticketNumber: string,
    subject: string,
    isNewTicket: boolean = true,
  ): Promise<boolean> {
    const action = isNewTicket ? "created" : "updated";
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Support Ticket ${action} - ${ticketNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Support Ticket ${action}</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Ticket #${ticketNumber}</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">Ticket Details</h2>
          <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          
          <div style="margin: 30px 0; padding: 20px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
            <p>Your support ticket has been ${action}. Our team will respond as soon as possible.</p>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/support/${ticketNumber}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Ticket</a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #333; color: white;">
          <p style="margin: 0;">Questions? Reply to this email or contact support@easesubs.com</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Support Ticket ${action} - EaseSubs
      
      Ticket Number: ${ticketNumber}
      Subject: ${subject}
      
      Your support ticket has been ${action}. Our team will respond as soon as possible.
      
      View ticket: ${process.env.NEXTAUTH_URL}/dashboard/support/${ticketNumber}
      
      Questions? Contact us at support@easesubs.com
    `;

    return this.sendEmail({
      to: email,
      subject: `Support Ticket ${action} - ${ticketNumber}`,
      html,
      text,
    });
  }
}

export const emailService = new EmailService();
