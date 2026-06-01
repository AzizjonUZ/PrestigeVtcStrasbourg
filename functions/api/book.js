/**
 * Cloudflare Pages Function for prestigevtcstrasbourg.fr
 * Handles reservation form submissions at POST /api/book,
 * verifies Turnstile tokens, and sends email notifications using the Resend API.
 * 
 * ENVIRONMENT VARIABLES REQUIRED (Set in Cloudflare Pages project settings):
 * - RESEND_API_KEY: Your API key from resend.com
 * - TURNSTILE_SECRET_KEY: (Optional) Your Turnstile Secret Key for spam prevention
 */

// Handle CORS Preflight OPTIONS request
export async function onRequestOptions(context) {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// Handle Form Submission POST request
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    // 1. Verify Cloudflare Turnstile token if secret key is present
    const turnstileToken = body["cf-turnstile-response"];
    const turnstileSecret = env.TURNSTILE_SECRET_KEY;

    if (turnstileSecret && turnstileToken) {
      let verifyFormData = new FormData();
      verifyFormData.append("secret", turnstileSecret);
      verifyFormData.append("response", turnstileToken);
      verifyFormData.append("remoteip", request.headers.get("CF-Connecting-IP") || "");

      const turnstileResult = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          body: verifyFormData,
          method: "POST",
        }
      );

      const turnstileOutcome = await turnstileResult.json();
      if (!turnstileOutcome.success) {
        return new Response(
          JSON.stringify({ success: false, message: "Validation CAPTCHA incorrect." }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    // 2. Validate essential fields
    const required = ["nom", "telephone", "email", "type-course", "depart-lieu", "date-course", "heure-course", "pax-count"];
    for (const field of required) {
      if (!body[field]) {
        return new Response(
          JSON.stringify({ success: false, message: `Champ manquant: ${field}` }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    // 3. Send email using Resend API
    const resendApiKey = env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY environment variable is missing.");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Réservation simulée avec succès. Configurez RESEND_API_KEY dans Cloudflare pour envoyer de vrais emails." 
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const isMiseADispo = body["type-course"] === "Mise à Disposition";
    const emailSubject = `[Réservation VTC] ${body["nom"]} - Le ${body["date-course"]} à ${body["heure-course"]}`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <div style="background-color: #0d0d0d; color: #c9a84c; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0; font-weight: normal; font-size: 22px;">Prestige VTC Strasbourg</h2>
          <p style="margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Nouvelle demande de réservation</p>
        </div>
        
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
          <h3 style="color: #b2933d; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 0;">1. Informations du Trajet</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 150px;">Type de course :</td>
              <td style="padding: 8px 0;">${body["type-course"]}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Lieu de Départ :</td>
              <td style="padding: 8px 0;">${body["depart-lieu"]}</td>
            </tr>
            ${!isMiseADispo ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Lieu de Destination :</td>
              <td style="padding: 8px 0;">${body["destination-lieu"]}</td>
            </tr>
            ` : `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Durée :</td>
              <td style="padding: 8px 0;">${body["durée-course"]} heure(s)</td>
            </tr>
            `}
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Date & Heure :</td>
              <td style="padding: 8px 0;">Le ${body["date-course"]} à ${body["heure-course"]}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Passagers :</td>
              <td style="padding: 8px 0;">${body["pax-count"]} personne(s)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Bagages :</td>
              <td style="padding: 8px 0;">${body["bagages-count"] || "0"} bagage(s)</td>
            </tr>
          </table>

          <h3 style="color: #b2933d; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px;">2. Informations Client</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 150px;">Nom complet :</td>
              <td style="padding: 8px 0;">${body["nom"]}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Téléphone :</td>
              <td style="padding: 8px 0;"><a href="tel:${body["telephone"]}">${body["telephone"]}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Adresse E-mail :</td>
              <td style="padding: 8px 0;"><a href="mailto:${body["email"]}">${body["email"]}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Siège bébé :</td>
              <td style="padding: 8px 0;">${body["siege-bebe"] === "oui" ? "Oui" : "Non"}</td>
            </tr>
          </table>

          ${body["messages"] ? `
          <h3 style="color: #b2933d; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px;">3. Demande Particulière</h3>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 3px solid #c9a84c; font-style: italic;">
            ${body["messages"].replace(/\n/g, "<br>")}
          </div>
          ` : ""}

          <div style="margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            <p style="font-size: 12px; color: #777; margin: 0;">Ce message a été généré automatiquement depuis le formulaire de réservation de prestigevtcstrasbourg.fr.</p>
          </div>
        </div>
      </div>
    `;

    const emailRequest = {
      from: "Prestige VTC Strasbourg <bookings@prestigevtcstrasbourg.fr>",
      to: ["contact@prestigevtcstrasbourg.fr"],
      cc: [body["email"]],
      reply_to: body["email"],
      subject: emailSubject,
      html: htmlBody,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailRequest),
    });

    if (response.ok) {
      return new Response(
        JSON.stringify({ success: true, message: "Demande envoyée avec succès !" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } else {
      const resendError = await response.json();
      console.error("Resend API error:", resendError);
      return new Response(
        JSON.stringify({ success: false, message: "Erreur lors de l'envoi de l'email." }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  } catch (err) {
    console.error("Pages Function error:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Erreur interne du serveur." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
