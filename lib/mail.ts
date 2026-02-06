import nodemailer from 'nodemailer';
import config from './config';

const transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: {
        user: config.mail.user,
        pass: config.mail.pass,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        console.log('[MAIL DEBUG] Attempting to send email to:', to);
        const info = await transporter.sendMail({
            from: config.mail.from,
            to,
            subject,
            html,
        });
        console.log('Message sent: %s', info.messageId);
        console.log('[MAIL DEBUG] Email successfully sent to:', to);
        return true;
    } catch (error: any) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ EMAIL SENDING ERROR');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Recipient:', to);
        console.error('Subject:', subject);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error command:', error.command);
        console.error('Full error:', error);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return false;
    }
};
