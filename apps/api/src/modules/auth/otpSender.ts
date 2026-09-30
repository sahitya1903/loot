import type { Logger } from '../../lib/logger.js'

export interface OtpSender {
  send(phoneNumber: string, code: string): Promise<void>
}

interface WhatsAppConfig {
  phoneNumberId: string
  accessToken: string
  template: string
}

const GRAPH_API_VERSION = 'v23.0'

/** Sends the OTP through the WhatsApp Cloud API `send_otp` authentication template. */
export function createWhatsAppOtpSender(config: WhatsAppConfig, fetchImpl: typeof fetch = fetch): OtpSender {
  return {
    async send(phoneNumber, code) {
      const response = await fetchImpl(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'template',
            template: {
              name: config.template,
              language: { code: 'en_US' },
              components: [
                { type: 'body', parameters: [{ type: 'text', text: code }] },
                // Copy-code button on the authentication template
                { type: 'button', sub_type: 'url', index: 0, parameters: [{ type: 'text', text: code }] },
              ],
            },
          }),
          signal: AbortSignal.timeout(10_000),
        },
      )
      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`WhatsApp API responded ${response.status}: ${body.slice(0, 500)}`)
      }
    },
  }
}

/** Development only: logs the OTP instead of sending it. */
export function createLoggingOtpSender(logger: Logger): OtpSender {
  return {
    async send(phoneNumber, code) {
      logger.warn({ phoneNumber, code }, 'DEV OTP (not sent, WhatsApp credentials are not configured)')
    },
  }
}
