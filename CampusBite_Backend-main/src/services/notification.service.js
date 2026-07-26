const admin = require('firebase-admin');
const { Notification, User, FoodCourierProfile } = require('../models');

// Only initialize if all three Firebase env vars are present
const CONFIGURED = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

if (CONFIGURED) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // .env stores newlines as literal \n — restore them
      privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
} else {
  console.warn('[NOTIFY] Firebase env vars missing — push notifications disabled.');
}

/**
 * Send a push notification to a single device.
 * Silent no-op if Firebase is not configured or the token is missing.
 * Never throws — notification failure must never break the order/payment flow.
 *
 * @param {string|null} token - FCM device token stored on the User row
 * @param {string} title
 * @param {string} body
 * @param {object} [data] - Optional key-value payload for the app to consume
 */
async function send(token, title, body, data = {}) {
  if (!CONFIGURED || !token) return;
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns:    { payload: { aps: { sound: 'default', contentAvailable: true } } },
    });
  } catch (err) {
    console.warn('[NOTIFY] Push failed:', err.message);
  }
}

/**
 * Creates a persistent in-app notification for a user and, if they have a
 * device token, also fires an FCM push. Never throws — a notification
 * failure must never break the order/payment/approval flow that triggered it.
 *
 * @param {string} userId
 * @param {object} opts
 * @param {'order_status'|'payment'|'delivery'|'system'|'feedback'} opts.type
 * @param {string} opts.title
 * @param {string} opts.body
 * @param {object} [opts.data] - Extra payload (e.g. { order_id })
 */
async function notifyUser(userId, { type = 'system', title, body, data = {} }) {
  if (!userId) return;
  try {
    await Notification.create({ user_id: userId, type, title, body, data });
  } catch (err) {
    console.error('[NOTIFY] Failed to create notification:', err.message);
  }

  try {
    const user = await User.findByPk(userId, { attributes: ['fcm_token'] });
    if (user?.fcm_token) await send(user.fcm_token, title, body, data);
  } catch (err) {
    console.warn('[NOTIFY] Push lookup failed:', err.message);
  }
}

/**
 * Notifies every admin account — used for platform-level events (new vendor/
 * courier registrations, document submissions, reported issues) that don't
 * have one single obvious recipient.
 */
async function notifyAdmins(opts) {
  try {
    const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id'] });
    await Promise.all(admins.map((a) => notifyUser(a.id, opts)));
  } catch (err) {
    console.error('[NOTIFY] Failed to notify admins:', err.message);
  }
}

/**
 * Notifies every currently-available (online) food courier that an order is
 * ready for pickup. There's no location tracking for idle couriers (GPS is
 * only broadcast once a courier is already assigned to a delivery), so this
 * can't target the "closest" rider — it reaches everyone who has toggled
 * themselves available and lets them claim it first-come-first-served, same
 * as the existing "available orders" list they already browse.
 */
async function notifyAvailableCouriers(opts) {
  try {
    const couriers = await FoodCourierProfile.findAll({
      where: { is_available: true },
      attributes: ['user_id'],
    });
    await Promise.all(couriers.map((c) => notifyUser(c.user_id, opts)));
  } catch (err) {
    console.error('[NOTIFY] Failed to notify available couriers:', err.message);
  }
}

module.exports = { send, notifyUser, notifyAdmins, notifyAvailableCouriers };
