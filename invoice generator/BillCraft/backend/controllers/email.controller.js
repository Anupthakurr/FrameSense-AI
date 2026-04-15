import nodemailer from "nodemailer";
import { ApiResponse } from "../utils/ApiResponse.js";
import Client from "../models/client.model.js";
import User from "../models/user.model.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (req, res) => {
    const { id } = req.user;
    try {
        const userClients = await Client.find({ userId: id });
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                error: "User not found",
            });
        }
        if (!userClients.length) {
            return res.status(404).json({
                error: "No clients were found",
            });
        }
        const primaryRecipient = user.email;
        const recipientEmails = userClients
            .map((client) => client.email)
            .join(", ");

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: primaryRecipient, // primary recipients
            bcc: recipientEmails,
            subject: "Invoice",
            text: "This email is sent to multiple clients",
            html: `
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
                    <p>Hi there,</p>
            
                    <p>This is an invoice sent by <b>${primaryRecipient}</b> to multiple clients using <b>SmartInvoice</b>.</p>
                    <p>SmartInvoice is an invoice management system. Check it out here: 
                    <a href="https://invoice-generator-xt5k.vercel.app/" target="_blank">SmartInvoice</a>.
                    </p>
            
                    <p>Thanks!</p>
            
                    <br />
                    <p style="font-style: italic;">Best regards,</p>
                    <p style="font-weight: bold;">SmartInvoice Team</p>
                </body>
                </html>
            `,
            attachments: [
                {
                    filename: req.file.originalname,
                    content: req.file.buffer,
                    contentType: "application/pdf",
                },
            ],
        };
        const info = await transporter.sendMail(mailOptions);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    info.response,
                    `Email sent to ${userClients.length + 1} recipients`
                )
            );
    } catch (error) {
        res.status(500).json({
            error: `Failed to send email: error: ${error.message}`,
        });
    }
};

export { sendEmail };
