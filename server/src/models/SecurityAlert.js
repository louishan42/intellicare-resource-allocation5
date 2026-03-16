import mongoose from "mongoose";

const securityAlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    identifier: { type: String, index: true },
    displayName: { type: String, default: "" },
    role: { type: String },
    alertType: {
      type: String,
      enum: ["new_ip", "new_device", "failed_attempts", "suspicious_login", "blocked_login"],
      required: true
    },
    severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    message: { type: String, default: "" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

securityAlertSchema.index({ createdAt: -1 });
securityAlertSchema.index({ severity: 1, createdAt: -1 });

export default mongoose.model("SecurityAlert", securityAlertSchema);
