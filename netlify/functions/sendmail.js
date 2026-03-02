// ============================================================
//  NETLIFY FUNCTION — INVIO EMAIL (GMAIL) CON VARIABILI MAIL_*
// ============================================================

const nodemailer = require("nodemailer");

exports.handler = async (event, context) => {
  console.log("=== SENDMAIL FUNCTION START ===");

  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed"
      };
    }

    // ------------------------------------------------------------
    // LETTURA BODY
    // ------------------------------------------------------------
    const data = JSON.parse(event.body || "{}");

    const to = data.to;
    const subject = data.subject || "Checklist";
    const text = data.text || "In allegato la checklist.";
    const filename = data.filename || "checklist.pdf";
    const pdfBase64 = data.pdfBase64;

    if (!to || !pdfBase64) {
      return {
        statusCode: 400,
        body: "Missing parameters: to or pdfBase64"
      };
    }

    // ------------------------------------------------------------
    // CONFIGURAZIONE SMTP (USA LE TUE VARIABILI MAIL_*)
    // ------------------------------------------------------------
    console.log("SMTP CONFIG:");
    console.log("MAIL_HOST:", process.env.MAIL_HOST);
    console.log("MAIL_PORT:", process.env.MAIL_PORT);
    console.log("MAIL_USER:", process.env.MAIL_USER);
    console.log("MAIL_FROM:", process.env.MAIL_FROM);

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,              // smtp.gmail.com
      port: Number(process.env.MAIL_PORT),      // 587
      secure: process.env.MAIL_SECURE === "true", // false per Gmail STARTTLS
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // ------------------------------------------------------------
    // VERIFICA CONNESSIONE SMTP
    // ------------------------------------------------------------
    console.log("Verifica connessione SMTP...");
    await transporter.verify();
    console.log("SMTP OK — Connessione verificata");

    // ------------------------------------------------------------
    // INVIO EMAIL
    // ------------------------------------------------------------
    console.log("Invio email a:", to);

    const mailResult = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_USER,
      to: to,
      subject: subject,
      text: text,
      attachments: [
        {
          filename: filename,
          content: pdfBase64,
          encoding: "base64"
        }
      ]
    });

    console.log("EMAIL INVIATA CON SUCCESSO");
    console.log("Risultato:", mailResult);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        info: mailResult
      })
    };

  } catch (err) {
    console.error("=== ERRORE DURANTE L'INVIO ===");
    console.error("Messaggio:", err.message);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message
      })
    };
  }
};
