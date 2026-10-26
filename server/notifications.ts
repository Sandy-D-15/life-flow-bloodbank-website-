import nodemailer from 'nodemailer';

// Create SMTP Transporter from environment variables
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

const transporter = createTransporter();

export interface DonorEmailPayload {
  toEmail: string;
  donorName: string;
  donorId: string;
  bloodGroup: string;
  centerName?: string;
  centerAddress?: string;
  preferredDate?: string;
  alternateDate?: string;
  donationSlot?: string;
}

export async function sendDonorConfirmationEmail(payload: DonorEmailPayload): Promise<boolean> {
  const sender = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@lifeflow.org';
  if (!transporter) {
    console.log(`[Notification Service] SMTP credentials not fully configured. Email to ${payload.toEmail} simulated in logs.`);
    return false;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #111b31; padding: 28px 24px; text-align: center; color: #ffffff; }
        .badge { display: inline-block; padding: 4px 12px; background: rgba(240, 0, 60, 0.15); border: 1px solid #f0003c; border-radius: 9999px; color: #ff6b8b; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; }
        .content { padding: 32px 24px; }
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 13px; }
        .row:last-child { border-bottom: none; }
        .label { color: #64748b; font-weight: 500; }
        .val { font-weight: 700; color: #0f172a; text-align: right; }
        .blood-badge { color: #f0003c; font-weight: 800; font-size: 16px; }
        .btn { display: inline-block; background: #f0003c; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 13px; text-align: center; margin-top: 15px; }
        .footer { background: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 11px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="badge">Certified Voluntary Donor Network</div>
          <h2 style="margin: 0; font-size: 22px;">Appointment Confirmation</h2>
          <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">LifeFlow Blood Bank Management System</p>
        </div>
        <div class="content">
          <p style="font-size: 15px; margin-top: 0;">Dear <strong>${payload.donorName}</strong>,</p>
          <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            Thank you for volunteering to save lives. Your donation appointment and donor registration have been confirmed. Below are your appointment details:
          </p>
          
          <div class="info-box">
            <div class="row">
              <span class="label">Assigned Donor ID</span>
              <span class="val">${payload.donorId}</span>
            </div>
            <div class="row">
              <span class="label">Blood Phenotype</span>
              <span class="val blood-badge">${payload.bloodGroup}</span>
            </div>
            <div class="row">
              <span class="label">Donation Center</span>
              <span class="val">${payload.centerName || 'LifeFlow Central Transfusion Hub'}</span>
            </div>
            ${payload.centerAddress ? `
            <div class="row">
              <span class="label">Location</span>
              <span class="val">${payload.centerAddress}</span>
            </div>` : ''}
            <div class="row">
              <span class="label">Preferred Date & Slot</span>
              <span class="val">${payload.preferredDate || 'Earliest Slot'} (${payload.donationSlot || 'Standard'})</span>
            </div>
            ${payload.alternateDate ? `
            <div class="row" style="background: #eff6ff; margin: 4px -8px; padding: 6px 8px; border-radius: 6px;">
              <span class="label" style="color: #2563eb;">Backup Alternate Date</span>
              <span class="val" style="color: #1e40af;">${payload.alternateDate}</span>
            </div>` : ''}
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
            * Important: Please have a light, healthy meal and stay well hydrated prior to your appointment. Remember to bring a government-issued photo ID. Final clinical eligibility is confirmed on-site via vitals and hemoglobin check.
          </p>

          <div style="text-align: center; margin-top: 25px;">
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(payload.centerName || 'LifeFlow Blood Bank')}" class="btn">
              Get Directions in Google Maps →
            </a>
          </div>
        </div>
        <div class="footer">
          LifeFlow Blood Bank & Transfusion Services • 24/7 Helpline: 1800-BLOOD-FLOW<br>
          This is an automated clinical notification.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"LifeFlow Blood Bank" <${sender}>`,
      to: payload.toEmail,
      subject: `✓ LifeFlow Donor Appointment Confirmed [ID: ${payload.donorId}] - ${payload.bloodGroup}`,
      html: htmlContent,
    });
    console.log(`✓ [Notification Service] Appointment confirmation email dispatched to ${payload.toEmail} (MessageId: ${info.messageId})`);
    return true;
  } catch (err: any) {
    console.error(`! [Notification Service] Email dispatch error:`, err.message);
    return false;
  }
}

export interface RequisitionEmailPayload {
  toEmail: string;
  hospitalName: string;
  reqId: string;
  bloodGroup: string;
  units: number;
  urgency: string;
  stage: string;
  notes?: string;
}

export async function sendRequisitionStatusEmail(payload: RequisitionEmailPayload): Promise<boolean> {
  const sender = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@lifeflow.org';
  if (!transporter) return false;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; background-color: #f8fafc; padding: 20px; color: #1e293b; }
        .card { max-width: 580px; margin: 0 auto; background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: #111b31; padding: 20px; text-align: center; color: #fff; }
        .content { padding: 24px; }
        .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin: 15px 0; font-size: 13px; }
        .badge { font-weight: bold; color: #f0003c; }
        .btn { display: inline-block; background: #111b31; color: #ffffff !important; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h3 style="margin: 0;">Clinical Requisition Update</h3>
          <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">LifeFlow Blood Bank Emergency Dispatch</p>
        </div>
        <div class="content">
          <p>Hospital Facility: <strong>${payload.hospitalName}</strong></p>
          <div class="box">
            <p style="margin: 0 0 8px;">Requisition Reference: <strong>${payload.reqId}</strong></p>
            <p style="margin: 0 0 8px;">Required Units: <span class="badge">${payload.units} Unit(s) of ${payload.bloodGroup}</span></p>
            <p style="margin: 0 0 8px;">Urgency Priority: <strong>${payload.urgency}</strong></p>
            <p style="margin: 0;">Current Status Stage: <strong style="color: #0284c7;">${payload.stage}</strong></p>
            ${payload.notes ? `<p style="margin: 8px 0 0; color: #64748b;">Clinical Log Note: <em>${payload.notes}</em></p>` : ''}
          </div>
          <p style="font-size: 12px; color: #64748b;">
            Track your cold-chain dispatch and requisition in real-time through the LifeFlow Public Request Tracker with reference <strong>${payload.reqId}</strong>.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"LifeFlow Dispatch" <${sender}>`,
      to: payload.toEmail,
      subject: `[LifeFlow] Requisition ${payload.reqId} Status Update: ${payload.stage}`,
      html: htmlContent,
    });
    return true;
  } catch (err: any) {
    console.error(`! [Notification Service] Requisition email error:`, err.message);
    return false;
  }
}
