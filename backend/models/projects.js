import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true }, // the title of the project
  description: { type: String, required: true },
  year: { type: Number, required: true }, // year the student is doing the project לאיזה שנתון שייך הפרוייקט
  suitableFor: { type: String, required: true }, // solo / duo / both
  type: { type: String, required: true }, // research / development / hitech / other
  externalEmail: { type: String, required: false }, // the email of the external partner
  continues: { type: Boolean, required: false, default: false }, // is it a continues project
  isApproved: { type: Boolean, required: false, default: false }, // is it approved by the coordinator
  isFinished: { type: Boolean, required: false, default: false }, // is it finished
  isTerminated: { type: Boolean, required: false, default: false }, // is it terminated
  isTaken: { type: Boolean, required: false, default: false }, // is it taken by a student
  advisors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: [] }], // the advisor(s) of the project
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: [] }], // the student(s) of the project
  candidates: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the User model
      joinDate: { type: Date, default: Date.now() }, // Store the date the student joined
    },
  ],
  grades: [{ type: mongoose.Schema.Types.ObjectId, ref: "Grade", required: false, default: [] }], // the grades of the project
});

// Create a compound index to ensure title + year combination is unique
projectSchema.index({ title: 1, year: 1 }, { unique: true });

const projectModel = mongoose.model("Project", projectSchema);
export default projectModel;
