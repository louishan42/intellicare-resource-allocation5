import jwt from "jsonwebtoken";
import User from "../models/User.js";
import LoginEvent from "../models/LoginEvent.js";
import SecurityAlert from "../models/SecurityAlert.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { getRequestContext } from "../utils/requestContext.js";
import { assessLoginRisk } from "../services/riskEngine.js";

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email, nric: user.nric },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function logLoginAndAssess({ user, identifier, success, req }) {
  const { ip, userAgent, deviceHash } = getRequestContext(req);
  const risk = await assessLoginRisk({
    identifier,
    ip,
    deviceHash,
    success
  });

  const event = await LoginEvent.create({
    userId: user?._id,
    identifier,
    displayName: user?.displayName || "",
    role: user?.role,
    success,
    ip,
    userAgent,
    deviceHash,
    riskScore: risk.score,
    riskReasons: risk.reasons,
    action: risk.action
  });

  if (risk.score >= 50) {
    await SecurityAlert.create({
      userId: user?._id,
      identifier,
      displayName: user?.displayName || "",
      role: user?.role,
      alertType: risk.reasons.includes("Too many failed login attempts") ? "blocked_login" : "suspicious_login",
      severity: risk.score >= 70 ? "high" : "medium",
      message: risk.reasons.join("; "),
      ip,
      userAgent,
      metadata: { riskScore: risk.score }
    });
  }

  if (risk.action === "block") {
    return { blocked: true, message: "Too many failed attempts. Please try again later." };
  }
  return { blocked: false };
}

export const registerPatient = async (req, res) => {
  const { nric, dob, password, displayName, email } = req.body || {};
  if (!nric || !password) return res.status(400).json({ message: "NRIC/FIN and password required" });

  const nricNorm = String(nric || "").trim().toUpperCase();
  const orCond = [{ nric: nricNorm }];
  if (email) orCond.push({ email: email.toLowerCase().trim() });
  const exists = await User.findOne({ $or: orCond });
  if (exists) return res.status(409).json({ message: "NRIC or email already registered" });

  const hashed = await hashPassword(password);
  const doc = { nric: nricNorm, dob: dob ? new Date(dob) : null, password: hashed, role: "patient", displayName: displayName || "" };
  if (email) doc.email = email.toLowerCase().trim();
  const user = await User.create(doc);

  const token = signToken(user);
  res.status(201).json({ token, user: { id: user._id, role: user.role, nric: user.nric, displayName: user.displayName } });
};

export const login = async (req, res) => {
  const { nric, dob, password, email } = req.body || {};
  // Patient: NRIC + password (DOB optional verification)
  if (nric && password) {
    const nricNorm = String(nric).trim().toUpperCase();
    const user = await User.findOne({ nric: nricNorm, role: "patient" });
    if (!user) {
      const blockCheck = await logLoginAndAssess({ user: null, identifier: nricNorm, success: false, req });
      if (blockCheck.blocked) return res.status(429).json({ message: blockCheck.message });
      return res.status(401).json({ message: "Invalid NRIC or password" });
    }
    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      const blockCheck = await logLoginAndAssess({ user, identifier: nricNorm, success: false, req });
      if (blockCheck.blocked) return res.status(429).json({ message: blockCheck.message });
      return res.status(401).json({ message: "Invalid NRIC or password" });
    }
    if (dob && user.dob) {
      const dobUser = new Date(user.dob).toISOString().slice(0, 10);
      const dobInput = new Date(dob).toISOString().slice(0, 10);
      if (dobUser !== dobInput) {
        await logLoginAndAssess({ user, identifier: nricNorm, success: false, req });
        return res.status(401).json({ message: "Date of birth does not match" });
      }
    }
    const blockCheck = await logLoginAndAssess({ user, identifier: nricNorm, success: true, req });
    if (blockCheck.blocked) return res.status(429).json({ message: blockCheck.message });
    const token = signToken(user);
    return res.json({ token, user: { id: user._id, role: user.role, nric: user.nric, displayName: user.displayName } });
  }
  // Staff/Admin: email + password
  if (!email || !password) return res.status(400).json({ message: "NRIC + password (patient) or email + password (staff/admin) required" });
  const emailNorm = email.toLowerCase().trim();
  const user = await User.findOne({ email: emailNorm });
  if (!user) {
    const blockCheck = await logLoginAndAssess({ user: null, identifier: emailNorm, success: false, req });
    if (blockCheck.blocked) return res.status(429).json({ message: blockCheck.message });
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    const blockCheck = await logLoginAndAssess({ user, identifier: emailNorm, success: false, req });
    if (blockCheck.blocked) return res.status(429).json({ message: blockCheck.message });
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const blockCheck = await logLoginAndAssess({ user, identifier: emailNorm, success: true, req });
  if (blockCheck.blocked) return res.status(429).json({ message: blockCheck.message });
  const token = signToken(user);
  res.json({ token, user: { id: user._id, role: user.role, email: user.email, displayName: user.displayName } });
};

export const me = async (req, res) => {
  const user = await User.findById(req.user.id).select("_id email nric dob role displayName");
  res.json({ user });
};
