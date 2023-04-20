const MAILCHANNEL_URL = "https://api.mailchannels.net/tx/v1/send";

export type Email = {
  email: string;
  name: string;
};

export type EmailContent = {
  type: string;
  value: string;
};

/*

ref: https://blog.cloudflare.com/sending-email-from-workers-with-mailchannels/
*/
export async function sendEmail(
  toEmail: Array<Email>,
  fromEmail: Email,
  subject: string,
  content: Array<EmailContent>
) {
  return await fetch(MAILCHANNEL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: toEmail }],
      from: fromEmail,
      subject: subject,
      content: content,
    }),
  })
    .then(resp => resp.json())
    .catch(err => console.error(err));
}
