"use strict";

const crypto = require("node:crypto");
const nodemailer = require("nodemailer");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

initializeApp();
const db = getFirestore();

const SMTP_USER = defineSecret("SMTP_USER");
const SMTP_PASS = defineSecret("SMTP_PASS");
const OTP_PEPPER = defineSecret("OTP_PEPPER");
const SMTP_HOST = defineString("SMTP_HOST", { default: "smtp.gmail.com" });
const SMTP_PORT = defineString("SMTP_PORT", { default: "465" });
const SMTP_FROM = defineString("SMTP_FROM", { default: "Sucesso <help.sucsso@gmail.com>" });
const AUTH_CONTINUE_URL = defineString("AUTH_CONTINUE_URL", { default: "https://www.sucessobrand.com/login.html" });
const BRAND_LOGO_URL = defineString("BRAND_LOGO_URL", { default: "https://www.sucessobrand.com/images/logo%20cherry%20png.png" });

const REGION = "us-central1";
const OTP_TTL_MS = 15 * 60 * 1000;
const RESEND_WAIT_MS = 45 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_DAILY_REQUESTS = 12;

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}
function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function emailKey(email) {
  return crypto.createHash("sha256").update(email).digest("hex");
}
function codeHash(email, code) {
  return crypto.createHmac("sha256", OTP_PEPPER.value()).update(`${email}:${code}`).digest("hex");
}
function safeEqualHex(a, b) {
  try {
    const x = Buffer.from(String(a), "hex");
    const y = Buffer.from(String(b), "hex");
    return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
  } catch (_) {
    return false;
  }
}
function localeOf(value) { return value === "en" ? "en" : "es"; }
function nowUtcDay() { return new Date().toISOString().slice(0, 10); }
function clientIp(request) {
  const forwarded = request.rawRequest?.headers?.["x-forwarded-for"];
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || request.rawRequest?.ip || "unknown").split(",")[0].trim();
}
function ipKey(ip) { return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 40); }

function buildEmail({ code, locale }) {
  const es = locale === "es";
  const subject = es ? `Tu código es ${code}` : `Your code is ${code}`;
  const intro = es ? "Tu código de verificación:" : "Your verification code:";
  const expiry = es ? "Este código solo se puede usar una vez. Vencerá en 15 minutos." : "This code can only be used once. It expires in 15 minutes.";
  const ignore = es ? "Si tú no solicitaste este código, puedes ignorar este correo." : "If you did not request this code, you can ignore this email.";
  const html = `<!doctype html><html><body style="margin:0;background:#fff;color:#252525;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff"><tr><td align="center" style="padding:48px 20px"><table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:520px;width:100%;text-align:center"><tr><td style="padding-bottom:34px"><img src="${BRAND_LOGO_URL.value()}" alt="Sucesso" width="94" style="display:block;margin:0 auto;width:94px;height:auto"></td></tr><tr><td style="font-size:15px;padding-bottom:14px">${intro}</td></tr><tr><td style="font-size:24px;font-weight:700;letter-spacing:11px;padding:0 0 17px 11px">${code}</td></tr><tr><td style="font-size:13px;line-height:1.5;padding-bottom:36px">${expiry}</td></tr><tr><td style="font-size:12px;line-height:1.5;color:#777;padding-top:16px;border-top:1px solid #eee">${ignore}<br><br>© Sucesso</td></tr></table></td></tr></table></body></html>`;
  const text = `${intro}\n\n${code}\n\n${expiry}\n\n${ignore}\n\n© Sucesso`;
  return { subject, html, text };
}

function transporter() {
  const port = Number(SMTP_PORT.value() || 465);
  return nodemailer.createTransport({
    host: SMTP_HOST.value(),
    port,
    secure: port === 465,
    auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() },
    pool: true,
    maxConnections: 3,
    maxMessages: 60
  });
}

exports.requestEmailCode = onCall({
  region: REGION,
  secrets: [SMTP_USER, SMTP_PASS, OTP_PEPPER],
  timeoutSeconds: 30,
  memory: "256MiB"
}, async (request) => {
  const email = normalizeEmail(request.data?.email);
  const locale = localeOf(request.data?.locale);
  if (!isValidEmail(email)) throw new HttpsError("invalid-argument", "Invalid email.");

  const now = Date.now();
  const key = emailKey(email);
  const ref = db.collection("authEmailCodes").doc(key);
  const ip = clientIp(request);
  const dailyRef = db.collection("authRateLimits").doc(`${nowUtcDay()}_${ipKey(ip)}`);

  await db.runTransaction(async (tx) => {
    const [otpSnap, rateSnap] = await Promise.all([tx.get(ref), tx.get(dailyRef)]);
    const existing = otpSnap.exists ? otpSnap.data() : null;
    const lastSent = Number(existing?.lastSentAtMs || 0);
    if (lastSent && now - lastSent < RESEND_WAIT_MS) {
      throw new HttpsError("resource-exhausted", "Please wait before requesting another code.");
    }
    const count = Number(rateSnap.exists ? rateSnap.data()?.count || 0 : 0);
    if (count >= MAX_DAILY_REQUESTS) {
      throw new HttpsError("resource-exhausted", "Request limit reached.");
    }
    tx.set(dailyRef, { count: count + 1, day: nowUtcDay(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });

  const code = String(crypto.randomInt(100000, 1000000));
  let signInLink;
  try {
    signInLink = await getAuth().generateSignInWithEmailLink(email, {
      url: AUTH_CONTINUE_URL.value(),
      handleCodeInApp: true
    });
  } catch (error) {
    logger.error("Could not generate Firebase email sign-in link", error);
    throw new HttpsError("failed-precondition", "Email-link sign-in is not enabled or the continue domain is not authorized.");
  }

  await ref.set({
    email,
    codeHash: codeHash(email, code),
    signInLink,
    locale,
    attempts: 0,
    createdAt: FieldValue.serverTimestamp(),
    lastSentAt: FieldValue.serverTimestamp(),
    lastSentAtMs: now,
    expiresAtMs: now + OTP_TTL_MS
  });

  const message = buildEmail({ code, locale });
  try {
    await transporter().sendMail({
      from: SMTP_FROM.value(),
      to: email,
      subject: message.subject,
      text: message.text,
      html: message.html
    });
  } catch (error) {
    logger.error("OTP email delivery failed", { emailHash: key.slice(0, 12), error });
    await ref.delete().catch(() => {});
    throw new HttpsError("unavailable", "Email delivery failed.");
  }

  logger.info("OTP email sent", { emailHash: key.slice(0, 12) });
  return { ok: true, expiresIn: OTP_TTL_MS / 1000 };
});

exports.verifyEmailCode = onCall({
  region: REGION,
  secrets: [OTP_PEPPER],
  timeoutSeconds: 15,
  memory: "256MiB"
}, async (request) => {
  const email = normalizeEmail(request.data?.email);
  const code = String(request.data?.code || "").replace(/\D/g, "");
  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) throw new HttpsError("invalid-argument", "Invalid verification data.");

  const ref = db.collection("authEmailCodes").doc(emailKey(email));
  const now = Date.now();
  let signInLink = null;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError("failed-precondition", "Code expired or not found.");
    const data = snap.data();
    if (data.email !== email || Number(data.expiresAtMs || 0) < now) {
      tx.delete(ref);
      throw new HttpsError("deadline-exceeded", "Code expired.");
    }
    const attempts = Number(data.attempts || 0);
    if (attempts >= MAX_ATTEMPTS) {
      tx.delete(ref);
      throw new HttpsError("resource-exhausted", "Too many attempts.");
    }
    const matches = safeEqualHex(data.codeHash, codeHash(email, code));
    if (!matches) {
      if (attempts + 1 >= MAX_ATTEMPTS) tx.delete(ref);
      else tx.update(ref, { attempts: attempts + 1, lastAttemptAt: FieldValue.serverTimestamp() });
      throw new HttpsError(attempts + 1 >= MAX_ATTEMPTS ? "resource-exhausted" : "permission-denied", "Incorrect code.");
    }
    signInLink = data.signInLink;
    tx.delete(ref);
  });

  if (!signInLink) throw new HttpsError("internal", "Missing sign-in link.");
  return { ok: true, signInLink };
});
