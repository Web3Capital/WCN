/**
 * @wcn/email — Port Definitions
 */

export interface EmailPort {
  send(to: string, subject: string, html: string): Promise<boolean>;
}
