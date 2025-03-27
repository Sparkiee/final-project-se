import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    grades: [{ type: mongoose.Schema.Types.ObjectId, ref: "Grade", required: false, default: [] }],
    finalGrade: { type: Number, required: false, default: null },
    name: { type: String, required: true },
    file: { type: mongoose.Schema.Types.ObjectId, ref: "Upload", required: false },
    fileNeeded: { type: Boolean, required: true },
    submissionDate: { type: Date },
    isReviewed: { type: Boolean, default: false },
    isGraded: { type: Boolean, default: false },
    noJudges: { type: Boolean, default: false },
    submissionInfo: { type: String, default: "" },
    uploadDate: { type: Date },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    gradingTable: { type: mongoose.Schema.Types.ObjectId, ref: "GradingTable", required: false },
    editable: { type: Boolean, default: true },
    askForExtraUpload: { type: Boolean, default: false },
    requestExtraUploadDate: { type: Date },
    gotExtraUpload: { type: Boolean, default: false },
    gotExtraUploadDate: { type: Date },
    denyExtraUpload: { type: Boolean, default: false },
    askAgainForExtraUpload: { type: Boolean, default: false },
    extraUploadFile: { type: mongoose.Schema.Types.ObjectId, ref: "Upload", required: false },
    extraUploadDate: { type: Date },
    extraUploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    overridden: {
      type: {
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        oldGrades: [
          {
            grade: { type: Number, required: true },
            comment: { type: String },
          },
        ],
        newGrade: { type: Number, required: true },
      },
      required: false,
    },
  },
  { timestamps: true }
);

const submissionModel = mongoose.model("Submission", submissionSchema);
export default submissionModel;
