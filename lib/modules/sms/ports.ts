/**
 * @wcn/sms — Port Definitions
 */

export interface SmsPort {
  sendOtp(phone: string, code: string): Promise<boolean>;
}
