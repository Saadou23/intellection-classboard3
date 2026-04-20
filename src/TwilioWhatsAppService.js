import html2pdf from 'html2pdf.js';

/**
 * Service pour envoyer des messages WhatsApp via Twilio
 *
 * SETUP TWILIO:
 * 1. Créer compte Twilio: https://www.twilio.com/console
 * 2. Activer WhatsApp Sandbox
 * 3. Ajouter des numéros à tester
 * 4. Copier AccountSID, AuthToken, PhoneNumber
 *
 * Variables d'environnement requises:
 * - VITE_TWILIO_ACCOUNT_SID
 * - VITE_TWILIO_AUTH_TOKEN
 * - VITE_TWILIO_WHATSAPP_NUMBER (ex: whatsapp:+1234567890)
 */

class TwilioWhatsAppService {
  static TWILIO_API_URL = 'https://api.twilio.com/2010-04-01';
  static TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
  static TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
  static TWILIO_WHATSAPP_NUMBER = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155552671'; // Sandbox par défaut

  /**
   * Envoyer un message WhatsApp avec texte
   * @param {string} toNumber - Numéro destination (ex: "+212612345678")
   * @param {string} message - Message texte
   * @returns {Promise<Object>} Réponse Twilio
   */
  static async sendMessage(toNumber, message) {
    try {
      const formData = new URLSearchParams();
      formData.append('From', this.TWILIO_WHATSAPP_NUMBER);
      formData.append('To', `whatsapp:${this._formatNumber(toNumber)}`);
      formData.append('Body', message);

      const response = await fetch(
        `${this.TWILIO_API_URL}/Accounts/${this.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${this.TWILIO_ACCOUNT_SID}:${this.TWILIO_AUTH_TOKEN}`),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Message envoyé:', data.sid);
      return { success: true, messageId: data.sid };
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoyer un document/image via WhatsApp
   * @param {string} toNumber - Numéro destination
   * @param {string} mediaUrl - URL du document/image
   * @param {string} caption - Texte optionnel
   * @returns {Promise<Object>} Réponse Twilio
   */
  static async sendMedia(toNumber, mediaUrl, caption = '') {
    try {
      const formData = new URLSearchParams();
      formData.append('From', this.TWILIO_WHATSAPP_NUMBER);
      formData.append('To', `whatsapp:${this._formatNumber(toNumber)}`);
      formData.append('MediaUrl', mediaUrl);
      if (caption) {
        formData.append('Body', caption);
      }

      const response = await fetch(
        `${this.TWILIO_API_URL}/Accounts/${this.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${this.TWILIO_ACCOUNT_SID}:${this.TWILIO_AUTH_TOKEN}`),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Média envoyé:', data.sid);
      return { success: true, messageId: data.sid };
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du média:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoyer un PDF généré depuis un canvas HTML
   * @param {string} toNumber - Numéro destination
   * @param {HTMLElement} element - Élément HTML à convertir en PDF
   * @param {string} filename - Nom du fichier (ex: "emploi_marrakech.pdf")
   * @param {string} caption - Message WhatsApp
   * @returns {Promise<Object>}
   */
  static async sendPDFFromElement(toNumber, element, filename, caption) {
    try {
      return new Promise((resolve, reject) => {
        html2pdf()
          .set({
            margin: 5,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
          })
          .from(element)
          .toPdf()
          .get('pdf')
          .then(async (pdf) => {
            // Convertir le PDF en blob
            const blob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });

            // Upload temporaire (Firebase Storage ou équivalent)
            // Pour simplifier, on peut aussi utiliser une solution comme imgbb ou cloudinary
            const formData = new FormData();
            formData.append('file', blob, filename);

            // Exemple avec Firebase Storage
            try {
              const response = await fetch('/api/upload-pdf', {
                method: 'POST',
                body: formData
              });

              if (!response.ok) {
                throw new Error('Upload failed');
              }

              const { pdfUrl } = await response.json();

              // Envoyer via Twilio
              const result = await this.sendMedia(toNumber, pdfUrl, caption);
              resolve(result);
            } catch (uploadError) {
              reject(uploadError);
            }
          })
          .catch(reject);
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du PDF:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoyer un message avec des boutons (template)
   * @param {string} toNumber - Numéro destination
   * @param {string} text - Texte du message
   * @param {Array} buttons - [{id, title}, ...]
   * @returns {Promise<Object>}
   */
  static async sendTemplate(toNumber, text, buttons = []) {
    try {
      // Pour les templates avancés, utiliser Twilio Studio ou Content API
      // Ceci est un exemple simplifié
      let message = text;
      if (buttons.length > 0) {
        message += '\n\n';
        buttons.forEach((btn, index) => {
          message += `${index + 1}. ${btn.title}\n`;
        });
      }

      return await this.sendMessage(toNumber, message);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Valider un numéro WhatsApp
   * @param {string} number - Numéro à valider
   * @returns {boolean}
   */
  static isValidNumber(number) {
    const formatted = this._formatNumber(number);
    return /^\+\d{10,15}$/.test(formatted);
  }

  /**
   * Formater un numéro WhatsApp
   * @private
   */
  static _formatNumber(number) {
    let cleaned = number.replace(/\D/g, '');

    // Ajouter le code pays si absent
    if (!cleaned.startsWith('212') && !cleaned.startsWith('1')) {
      if (cleaned.startsWith('0')) {
        cleaned = '212' + cleaned.substring(1);
      } else {
        cleaned = '212' + cleaned;
      }
    }

    return '+' + cleaned;
  }

  /**
   * Tester la connexion Twilio
   * @returns {Promise<boolean>}
   */
  static async testConnection() {
    try {
      const response = await fetch(
        `${this.TWILIO_API_URL}/Accounts/${this.TWILIO_ACCOUNT_SID}.json`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + btoa(`${this.TWILIO_ACCOUNT_SID}:${this.TWILIO_AUTH_TOKEN}`)
          }
        }
      );

      if (response.ok) {
        console.log('✅ Connexion Twilio OK');
        return true;
      } else {
        console.error('❌ Erreur Twilio:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      return false;
    }
  }
}

export default TwilioWhatsAppService;
