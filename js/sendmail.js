// ============================================================
//  NETLIFY FUNCTION — INVIO EMAIL CON LOG DETTAGLIATI (GMAIL)
// ============================================================

const nodemailer = require("nodemailer");

exports.handler = async (event, context) => {
  console.log("=== SENDMAIL FUNCTION START ===");

  try {
    console.log("HTTP METHOD:", event.httpMethod);

    if (event.httpMethod !== "POST") {
      console.log("ERRORE: Metodo non consentito");
      return {
        statusCode: 405,
        body: "Method Not Allowed"
      };
    }

    // ------------------------------------------------------------
    // LETTURA BODY
    // ------------------------------------------------------------
    console.log("Parsing JSON body...");
    const data = JSON.parse(event.body || "{}");

    const to = data.to;
    const subject = data.subject || "Checklist";
    const text = data.text || "In allegato la checklist.";
    const filename = data.filename || "checklist.pdf";
    const pdfBase64 = data.pdfBase64;

    console.log("Dati ricevuti:", { to, subject, filename });

    if (!to || !pdfBase64) {
      console.log("ERRORE: Parametri mancanti");
      return {
        statusCode: 400,
        body: "Missing parameters: to or pdfBase64"
      };
    }

    // ------------------------------------------------------------
    // CONFIGURAZIONE SMTP
    // ------------------------------------------------------------
    console.log("Configurazione SMTP...");

    console.log("SMTP_HOST:", process.env.SMTP_HOST);
    console.log("SMTP_PORT:", process.env.SMTP_PORT);
    console.log("SMTP_USER:", process.env.SMTP_USER);
    console.log("SMTP_FROM:", process.env.SMTP_FROM);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,            // smtp.gmail.com
      port: Number(process.env.SMTP_PORT),    // 587
      secure: false,                          // Gmail richiede STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
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
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
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
    console.error("Stack:", err.stack);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message,
        stack: err.stack
      })
    };
  }
};
