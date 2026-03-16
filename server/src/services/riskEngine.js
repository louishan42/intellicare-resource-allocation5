import LoginEvent from "../models/LoginEvent.js";

const FAILED_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 min
const FAILED_ATTEMPT_THRESHOLD = 5;

/**
 * Compute risk score and reasons for a login attempt.
 * Returns { score: 0-100, reasons: string[], action: "allow" | "allow_log" | "block" }
 */
export async function assessLoginRisk({ identifier, ip, deviceHash, success }) {
  const reasons = [];
  let score = 0;

  if (!success) {
    const recentFailures = await LoginEvent.countDocuments({
      identifier,
      success: false,
      createdAt: { $gte: new Date(Date.now() - FAILED_ATTEMPT_WINDOW_MS) }
    });
    if (recentFailures >= FAILED_ATTEMPT_THRESHOLD) {
      score += 80;
      reasons.push("Too many failed login attempts");
    } else {
      score += 20;
      reasons.push("Failed login");
    }
    return { score, reasons, action: score >= 80 ? "block" : "allow_log" };
  }

  const lastSuccess = await LoginEvent.findOne({
    identifier,
    success: true
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!lastSuccess) {
    reasons.push("First successful login");
    return { score: 10, reasons, action: "allow_log" };
  }

  const newIp = lastSuccess.ip && ip && lastSuccess.ip !== ip;
  const newDevice = lastSuccess.deviceHash && deviceHash && lastSuccess.deviceHash !== deviceHash;

  if (newIp) {
    score += 30;
    reasons.push("New IP address");
  }
  if (newDevice) {
    score += 25;
    reasons.push("New device");
  }
  if (newIp && newDevice) {
    score += 20;
    reasons.push("New location and device");
  }

  if (score >= 70) return { score, reasons, action: "allow_log" };
  if (score >= 40) return { score, reasons, action: "allow_log" };
  return { score, reasons, action: "allow" };
}
