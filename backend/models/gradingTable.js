import mongoose from "mongoose";

const gradingTableSchema = new mongoose.Schema(
  {
    year: { type: String, required: true },
    forSubmission: { type: String, required: true },
    averageCalculation: { type: Boolean, default: false }, // If false -> calculate by median | If true -> calculate by average
    numericValues: {
      type: [
        {
          letter: { type: String, required: true },
          value: { type: Number, default: null },
        },
      ],
      default: [
        { letter: "A+", value: 0 },
        { letter: "A", value: 0 },
        { letter: "A-", value: 0 },
        { letter: "B+", value: 0 },
        { letter: "B", value: 0 },
        { letter: "B-", value: 0 },
        { letter: "C+", value: 0 },
        { letter: "C", value: 0 },
        { letter: "C-", value: 0 },
        { letter: "D+", value: 0 },
        { letter: "D", value: 0 },
        { letter: "D-", value: 0 },
        { letter: "E", value: 0 },
        { letter: "F", value: 0 },
      ],
    },
  },
  { timestamps: true }
);

const gradingTableModel = mongoose.model("GradingTable", gradingTableSchema);
export default gradingTableModel;
