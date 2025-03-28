import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstLogin: { type: Boolean, required: true, default: true },
  isStudent: { type: Boolean, required: true, default: true },
  isAdvisor: { type: Boolean, required: true, default: false },
  isCoordinator: { type: Boolean, required: true, default: false },
  isJudge: { type: Boolean, required: true, default: false },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project", required: false, default: [] }],
  interests: { type: String, default: "" },
  registerDate: { type: Date, required: true, default: Date.now },
  suspended: { type: Boolean, default: false },
  suspendedAt: { type: Date, default: null },
  suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  suspendedReason: { type: String, default: null },
  suspensionRecords: { type: Array, required: true, default: [] },
  updatedAt: { type: Date, default: Date.now },
  rememberMe: { type: Boolean, default: false },
  expireDate: { type: Number, default: null },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  resetPasswordRequest: { type: Boolean, default: false },
  resetPasswordRequestDate: { type: Date },
  resetPasswordRequestApprovedDate: { type: Date },
  resetPasswordRequestRejectionDate: { type: Date },
});

const userModel = mongoose.model("User", userSchema);
export default userModel;
