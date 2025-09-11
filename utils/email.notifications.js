// import nodemailer from "nodemailer";

// const sendReminderEmail = async (data, userEmail) => {
//   try {
//     //  Gmail
//     const transport = nodemailer.createTransport({
//       host: process.env.MAIL_USER || "smtp.gmail.com",
//       service: "SendGrid",
//       port: 465,
//       secure: true, // true 
//       auth: {
//         user: process.env.MAIL_USER, //  Gmail   
//         pass: process.env.MAIL_PASS, // App Password
//       },
//     });

//     console.log("Transport created for:", userEmail);

//     const mailOptions =  {
//     from: `"Your Store" <${process.env.MAIL_USER}>`,
//     to: userEmail,
//     subject: `✅ Payment Confirmed - Order #${data.order || ""}`,
//     html: `
//       <div style="max-width: 650px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); padding: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);">
        
//         <!-- Header Section -->
//         <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center; position: relative;">
//           <div style="background: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
//             <div style="background: #fff; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
//               <span style="color: #f97316; font-size: 24px; font-weight: bold;">✓</span>
//             </div>
//           </div>
//           <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
//             Payment Successful!
//           </h1>
//           <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 400;">
//             Thank you for your purchase
//           </p>
//         </div>

//         <!-- Content Section -->
//         <div style="padding: 40px 30px; background: #fff; margin: 0;">
          
//           <!-- Greeting -->
//           <div style="margin-bottom: 30px;">
//             <p style="font-size: 18px; color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
//               Hello there! 👋
//             </p>
//             <p style="font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0;">
//               We're excited to confirm that your payment has been successfully processed. Here are the details of your transaction:
//             </p>
//           </div>

//           <!-- Order Details Card -->
//           <div style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 2px solid #fed7aa; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.1);">
//             <div style="display: flex; align-items: center; margin-bottom: 20px;">
//               <div style="background: linear-gradient(135deg, #f97316, #ea580c); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
//                 <span style="color: #fff; font-size: 18px;">📦</span>
//               </div>
//               <h2 style="margin: 0; color: #ea580c; font-size: 20px; font-weight: 700;">
//                 Order Details
//               </h2>
//             </div>
            
//             <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
//               <tr>
//                 <td style="padding: 12px 16px; font-weight: 600; color: #374151; background: #fff; border-radius: 8px 0 0 8px; border: 1px solid #e5e7eb; border-right: none; width: 40%;">
//                   Order ID:
//                 </td>
//                 <td style="padding: 12px 16px; color: #111827; background: #fff; border-radius: 0 8px 8px 0; border: 1px solid #e5e7eb; border-left: none; font-family: 'Courier New', monospace; font-weight: 600;">
//                   #${data.order}
//                 </td>
//               </tr>
//               <tr><td colspan="2" style="height: 8px;"></td></tr>
//               <tr>
//                 <td style="padding: 12px 16px; font-weight: 600; color: #374151; background: #fff; border-radius: 8px 0 0 8px; border: 1px solid #e5e7eb; border-right: none;">
//                   Amount Paid:
//                 </td>
//                 <td style="padding: 12px 16px; color: #059669; background: #fff; border-radius: 0 8px 8px 0; border: 1px solid #e5e7eb; border-left: none; font-weight: 700; font-size: 18px;">
//                   $${data.amount}
//                 </td>
//               </tr>
//               <tr><td colspan="2" style="height: 8px;"></td></tr>
//               <tr>
//                 <td style="padding: 12px 16px; font-weight: 600; color: #374151; background: #fff; border-radius: 8px 0 0 8px; border: 1px solid #e5e7eb; border-right: none;">
//                   Payment Method:
//                 </td>
//                 <td style="padding: 12px 16px; color: #111827; background: #fff; border-radius: 0 8px 8px 0; border: 1px solid #e5e7eb; border-left: none; font-weight: 500;">
//                   ${data.paymentMethod}
//                 </td>
//               </tr>
//               <tr><td colspan="2" style="height: 8px;"></td></tr>
//               <tr>
//                 <td style="padding: 12px 16px; font-weight: 600; color: #374151; background: #fff; border-radius: 8px 0 0 8px; border: 1px solid #e5e7eb; border-right: none;">
//                   Status:
//                 </td>
//                 <td style="padding: 12px 16px; background: #fff; border-radius: 0 8px 8px 0; border: 1px solid #e5e7eb; border-left: none;">
//                   <span style="background: linear-gradient(135deg, #059669, #047857); color: #fff; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
//                     ${data.status}
//                   </span>
//                 </td>
//               </tr>
//               <tr><td colspan="2" style="height: 8px;"></td></tr>
//               <tr>
//                 <td style="padding: 12px 16px; font-weight: 600; color: #374151; background: #fff; border-radius: 8px 0 0 8px; border: 1px solid #e5e7eb; border-right: none;">
//                   Transaction Date:
//                 </td>
//                 <td style="padding: 12px 16px; color: #111827; background: #fff; border-radius: 0 8px 8px 0; border: 1px solid #e5e7eb; border-left: none; font-weight: 500;">
//                   ${new Date(data.updatedAt || Date.now()).toLocaleString("en-EG", {
//                     timeZone: "Africa/Cairo",
//                     weekday: 'long',
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric',
//                     hour: '2-digit',
//                     minute: '2-digit'
//                   })}
//                 </td>
//               </tr>
//             </table>
//           </div>

//           <!-- Action Button -->
//           <div style="text-align: center; margin: 30px 0;">
//             <a href="#" style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 6px 20px rgba(249, 115, 22, 0.3); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px;">
//               📋 View Order Details
//             </a>
//           </div>

//           <!-- Additional Info -->
//           <div style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #3b82f6;">
//             <div style="display: flex; align-items: center; margin-bottom: 10px;">
//               <span style="font-size: 20px; margin-right: 8px;">📧</span>
//               <h3 style="margin: 0; color: #1e40af; font-size: 16px; font-weight: 600;">
//                 What's Next?
//               </h3>
//             </div>
//             <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
//               You will receive another email with tracking information once your order ships. If you have any questions, feel free to contact our support team.
//             </p>
//           </div>

//           <!-- Contact Support -->
//           <div style="text-align: center; margin: 30px 0;">
//             <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0;">
//               Need help? We're here for you!
//             </p>
//             <a href="mailto:support@yourstore.com" style="color: #f97316; text-decoration: none; font-weight: 600; font-size: 14px; border: 2px solid #f97316; padding: 8px 16px; border-radius: 6px; display: inline-block; transition: all 0.3s ease;">
//               📞 Contact Support
//             </a>
//           </div>
//         </div>

//         <!-- Footer Section -->
//         <div style="background: linear-gradient(135deg, #111827, #1f2937); color: #fff; padding: 30px; text-align: center;">
//           <div style="margin-bottom: 15px;">
//             <span style="background: linear-gradient(135deg, #f97316, #ea580c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
//               Your Store
//             </span>
//           </div>
//           <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px; line-height: 1.4;">
//             Thank you for choosing us. We appreciate your business and trust.
//           </p>
//           <p style="margin: 0; color: #6b7280; font-size: 11px;">
//             © ${new Date().getFullYear()} Your Store. All rights reserved.
//           </p>
          
//           <!-- Social Links (Optional) -->
//           <div style="margin-top: 15px;">
//             <a href="#" style="display: inline-block; margin: 0 8px; color: #f97316; text-decoration: none; font-size: 12px; padding: 6px 12px; border: 1px solid #374151; border-radius: 4px; transition: all 0.3s ease;">
//               Website
//             </a>
//             <a href="#" style="display: inline-block; margin: 0 8px; color: #f97316; text-decoration: none; font-size: 12px; padding: 6px 12px; border: 1px solid #374151; border-radius: 4px; transition: all 0.3s ease;">
//               Support
//             </a>
//           </div>
//         </div>
//       </div>
//     `,
//   };

//   const info = await transport.sendMail(mailOptions);
//     console.log("Professional orange-themed email sent successfully:", info.messageId);
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// };

// export default sendReminderEmail;

// import { Resend } from "resend";
// const resend = new Resend('re_dwFTE5Fu_3wxXoTG1eKjkrWPAw6vHyHja');
// const sendReminderEmail = async (data, userEmail) => {
//   try {
//     await resend.emails.send({
//   from: 'onboarding@resend.dev',
//   to: "menamosadef5@gmail.com",
//   subject: 'Hello World',
//   html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
// });

//     console.log("✅ Professional email sent successfully via Resend");
//   } catch (error) {
//     console.error("❌ Email sending failed:", error);
//   }
// };

// export default sendReminderEmail;
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendReminderEmail = async (data, userEmail) => {
  try {
    const msg = {
      to: userEmail, // recipient
      from: process.env.MAIL_USER, // must be your verified sender
      subject: `✅ Payment Confirmed - Order #${data.order || ""}`,
      html: `
      <div style="max-width: 650px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); padding: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
          <div style="background: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <div style="background: #fff; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
              <span style="color: #f97316; font-size: 24px; font-weight: bold;">✓</span>
            </div>
          </div>
          <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: 700;">
            Payment Successful!
          </h1>
          <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
            Thank you for your purchase
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; background: #fff;">
          <p style="font-size: 18px; color: #374151; margin-bottom: 15px;">
            Hello 👋
          </p>
          <p style="font-size: 16px; color: #6b7280; margin-bottom: 30px;">
            We're excited to confirm your payment. Here are the details:
          </p>

          <!-- Order Details -->
          <div style="background: #fffbeb; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 2px solid #fed7aa;">
            <h2 style="color: #ea580c; font-size: 20px; font-weight: 700; margin-bottom: 20px;">Order Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; font-weight: 600;">Order ID:</td>
                <td style="padding: 10px; font-family: monospace; font-weight: 600;">#${data.order}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: 600;">Amount:</td>
                <td style="padding: 10px; font-weight: 700; color: #059669;">$${data.amount}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: 600;">Payment Method:</td>
                <td style="padding: 10px;">${data.paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: 600;">Status:</td>
                <td style="padding: 10px;">
                  <span style="background: #059669; color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 12px;">
                    ${data.status}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: 600;">Date:</td>
                <td style="padding: 10px;">${new Date(data.updatedAt || Date.now()).toLocaleString("en-US")}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #1f2937; color: #fff; padding: 20px; text-align: center;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} Your Store. All rights reserved.
          </p>
        </div>
      </div>
    `,
    };

    // Send email
    const response = await sgMail.send(msg);
    console.log("✅ Email sent successfully:", response[0].statusCode);
  } catch (error) {
    console.error("❌ Error sending email:", error.response?.body || error.message);
  }
};

export default sendReminderEmail;
