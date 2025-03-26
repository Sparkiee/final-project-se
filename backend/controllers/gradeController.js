import Grade from "../models/grades.js";
import Submission from "../models/submission.js";
import Notification from "../models/notifications.js";
import GradingTable from "../models/gradingTable.js";
import User from "../models/users.js";
import nodemailer from "nodemailer";

// Add new grade
export const addGrade = async (req, res) => {
  const { submissionId, grade, videoQuality, workQuality, writingQuality, commits, journalActive, isGraded } = req.body;

  if (!grade && isGraded) {
    return res.status(400).json({ message: "חייב להזין ציון" });
  }

  try {
    // Check if judge already graded this submission
    const submission = await Submission.findById(submissionId).populate({
      path: "grades",
      match: { judge: req.user._id },
    });

    if (!submission) {
      return res.status(404).json({ message: "ההגשה לא נמצאה" });
    }

    // If judge already graded, update existing grade
    if (submission.grades.length > 0) {
      const existingGrade = submission.grades[0];
      await Grade.findByIdAndUpdate(existingGrade._id, {
        grade,
        videoQuality,
        workQuality,
        writingQuality,
        commits,
        journalActive,
        updatedAt: Date.now(),
      });
      return res.status(200).json({ message: "הציון עודכן בהצלחה" });
    }

    // Create new grade
    const newGrade = new Grade({
      grade,
      videoQuality,
      workQuality,
      writingQuality,
      commits,
      journalActive,
      judge: req.user._id,
    });

    await newGrade.save();

    // Add grade reference to submission
    submission.grades.push(newGrade._id);
    await submission.save();

    res.status(200).json({ message: "הציון נשמר בהצלחה" });
  } catch (error) {
    console.log("Error saving grade:", error);
    res.status(500).json({ message: "שגיאה בשמירת הציון" });
  }
};

// Update numeric values for grades
export const updateNumericValues = async (req, res) => {
  const { updatedValues, name, year } = req.body;

  try {
    // Find the grading table for the given submission name and year
    const gradingTable = await GradingTable.findOne({ forSubmission: name, year });

    if (!gradingTable) {
      return res.status(404).json({ message: "Grading table not found" });
    }

    // Update the numeric values in the grading table
    for (const [letter, value] of Object.entries(updatedValues)) {
      const numericValue = gradingTable.numericValues.find((nv) => nv.letter === letter);
      if (numericValue) {
        numericValue.value = value;
      }
    }

    await gradingTable.save();

    // Prepare the updated numeric values for response
    const letterToNumber = gradingTable.numericValues.reduce((acc, { letter, value }) => {
      acc[letter] = value;
      return acc;
    }, {});

    res.status(200).json({ message: "Numeric values updated successfully", letterToNumber });
  } catch (error) {
    console.log("Error updating numeric values:", error);
    res.status(500).json({ message: "Error updating numeric values" });
  }
};

export const getAllNumericValues = async (req, res) => {
  try {
    const gradingTables = await GradingTable.find();

    const groupedValues = gradingTables.map((table) => ({
      name: table.forSubmission,
      year: table.year,
      averageCalculation: table.averageCalculation, // Ensure this is included
      ...table.numericValues.reduce((obj, { letter, value }) => {
        obj[letter] = value;
        return obj;
      }, {}),
    }));

    res.status(200).json(groupedValues);
  } catch (error) {
    console.log("Error getting all numeric values:", error);
    res.status(500).json({ message: "Error getting all numeric values" });
  }
};

export const deleteGradingTable = async (req, res) => {
  const { name, year } = req.body;

  try {
    const gradingTable = await GradingTable.findOne({ forSubmission: name, year });

    if (!gradingTable) {
      return res.status(404).json({ message: "Grading table not found" });
    }

    const submissionWithGradingTable = await Submission.findOne({ gradingTable: gradingTable._id, editable: true });
    if (submissionWithGradingTable) {
      return res.status(400).json({ message: "Cannot delete grading table because it is in use" });
    }

    await GradingTable.findByIdAndDelete(gradingTable._id);

    res.status(200).json({ message: "Grading table deleted successfully" });
  } catch (error) {
    console.log("Error deleting grading table:", error);
    res.status(500).json({ message: "Error deleting grading table" });
  }
};

export const changeFinalGrade = async (req, res) => {
  const { id } = req.params;
  const { newGrade, comment } = req.body;

  try {
    const submission = await Submission.findById(id).populate("project");

    if (!submission) {
      return res.status(404).json({ message: "ההגשה לא נמצאה" });
    }

    const oldGrades = submission.overridden ? submission.overridden.oldGrades : [];
    oldGrades.push({
      grade: submission.finalGrade,
      comment: comment ? comment : "לא ניתנה סיבה",
    });

    submission.overridden = {
      by: req.user._id,
      oldGrades,
      newGrade,
    };
    submission.finalGrade = newGrade;
    await submission.save();

    // Create notifications for students and advisor
    const notifications = submission.project.students.map((student) => ({
      user: student.student,
      message: `הציון של "${submission.name}" עודכן`,
    }));
    notifications.push({
      user: submission.project.advisors[0],
      message: `הציון של "${submission.name}" עודכן`,
    });
    await Notification.insertMany(notifications);

    res.status(200).json({ message: "הציון הסופי עודכן בהצלחה" });
  } catch (error) {
    console.log("Error changing final grade:", error);
    res.status(500).json({ message: "Error changing final grade" });
  }
};

// Get grade by submission ID
export const getGradeBySubmission = async (req, res) => {
  const { submissionId } = req.params;

  try {
    const submission = await Submission.findById(submissionId).populate({
      path: "grades",
      match: { judge: req.user._id },
      populate: {
        path: "judge",
        select: "name email",
      },
    });

    if (!submission) {
      return res.status(404).json({ message: "ההגשה לא נמצאה" });
    }

    const grade = submission.grades[0] || null;

    res.status(200).json(grade);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "שגיאה בטעינת הציון" });
  }
};

export const updateCalculationMethod = async (req, res) => {
  const { submissionName, year, averageCalculation } = req.body;

  try {
    // Find the grading table for the given submission name and year
    const gradingTable = await GradingTable.findOne({ forSubmission: submissionName, year });

    if (!gradingTable) {
      return res.status(404).json({ message: "Grading table not found" });
    }

    // Update the averageCalculation field
    gradingTable.averageCalculation = averageCalculation;
    await gradingTable.save();

    res.status(200).json({ message: "Calculation method updated successfully" });
  } catch (error) {
    console.error("Error updating calculation method:", error);
    res.status(500).json({ message: "Error updating calculation method" });
  }
};

export const publishGrades = async (req, res) => {
  const { submissionName, year, group } = req.body;
  let usersToSendEmail = [];
  try {
    const submissions = await Submission.find({ name: submissionName }).populate("grades").populate("project");
    const gradingTable = await GradingTable.findOne({ forSubmission: submissionName, year: year });
    const filteredSubmissions = submissions.filter((submission) => submission.project.year === year);
    const advisorNotified = new Set();

    for (const submission of filteredSubmissions) {
      if (submission.editable === false) {
        continue;
      }

      const grades = [];
      let allGradesHaveNumericValue = true;
      let allGradesHaveVideoQuality = true;

      // Process all grades first
      for (const grade of submission.grades) {
        if (grade.numericGrade === null && grade.grade !== null) {
          const numericValueDoc = gradingTable.numericValues.find((nv) => nv.letter === grade.grade);
          if (!numericValueDoc) {
            return res.status(400).json({ message: `Missing numeric value for grade ${grade.grade}` });
          }
          grade.numericGrade = numericValueDoc.value;
          grade.editable = false;
          await grade.save();
        }

        if (grade.numericGrade !== null) {
          grades.push(grade.numericGrade);
        } else {
          allGradesHaveNumericValue = false;
        }

        if (grade.videoQuality !== undefined && grade.videoQuality !== null && grade.editable) {
          grade.editable = false;
          await grade.save();
        }
        if (grade.videoQuality === undefined || grade.videoQuality === null) {
          allGradesHaveVideoQuality = false;
        }
      }

      if (allGradesHaveNumericValue && grades.length > 0) {
        let finalGrade;

        if (gradingTable.averageCalculation) {
          // Calculate average
          const sum = grades.reduce((a, b) => a + b, 0);
          finalGrade = Math.round(sum / grades.length);
        } else {
          // Calculate median
          grades.sort((a, b) => a - b);
          const mid = Math.floor(grades.length / 2);
          finalGrade = grades.length % 2 === 0 ? Math.round((grades[mid - 1] + grades[mid]) / 2) : grades[mid];
        }

        submission.finalGrade = finalGrade;
        submission.editable = false;

        // Apply late submission penalty
        if (submission.fileNeeded) {
          const days = Math.ceil(
            (new Date(submission.uploadDate) - new Date(submission.submissionDate)) / (1000 * 60 * 60 * 24)
          );
          submission.finalGrade -= days * 2;
          if (submission.finalGrade < 0) submission.finalGrade = 0;
        }
      } else {
        submission.finalGrade = null;
      }

      if (allGradesHaveVideoQuality && !allGradesHaveNumericValue) {
        submission.editable = false;
      }

      await submission.save();

      // Create notifications for students
      const notifications = submission.project.students.map((student) => {
        usersToSendEmail.push(student.student);
        return {
          user: student.student,
          message: `הציון עבור "${submission.name}" פורסם`,
        };
      });

      // Create notification for advisor if not already notified
      if (!advisorNotified.has(submission.project.advisors[0].toString())) {
        notifications.push({
          user: submission.project.advisors[0],
          message: `הציון עבור "${submission.name}" פורסם`,
        });
        advisorNotified.add(submission.project.advisors[0].toString());
        usersToSendEmail.push(submission.project.advisors[0]);
      }

      await Notification.insertMany(notifications);
    }

    res.status(200).json({ message: "Grades were published" });

    // Send email to students and advisor
    sendGradesEmail(usersToSendEmail, submissionName);
  } catch (error) {
    console.error("Error while publishing grades:", error);
    res.status(500).json({ message: "Error while publishing grades" });
  }
};

export const sendGradesEmail = async (users, submissionName) => {
  try {
    if (!Array.isArray(users) || users.length === 0) {
      console.error("Invalid or empty users array");
      return;
    }

    // Find users by their IDs
    const usersToSendEmail = await User.find({ _id: { $in: users } }).select("email name");
    if (usersToSendEmail.length === 0) {
      console.error("No users found for the provided IDs");
      return;
    }

    const emails = usersToSendEmail.map((user) => ({
      email: user.email,
      name: user.name,
    }));

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    for (let i = 0; i < emails.length; i += 10) {
      const batch = emails.slice(i, i + 10);

      await Promise.all(
        batch.map(async ({ email, name }) => {
          const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: `פורסם ציון חדש - ${submissionName}`,
            html: `
              <html lang="he" dir="rtl">
              <head>
                <meta charset="UTF-8" />
                <title>פורסם ציון חדש</title>
              </head>
              <body>
                <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px">
                  <div style="display: flex; align-items: center; align-items: center">
                    <h4 style="color: #464bd8">מערכת לניהול פרויקטים</h4>
                    <img
                      src="https://i.postimg.cc/bNtFxdXh/project-management-logo.png"
                      alt="Project Management Logo"
                      style="height: 50px" />
                  </div>
                  <hr />
                  <h2 style="color: #333; text-align: center">פורסם ציון חדש!</h2>
                  <p>שלום ${name},</p>
                  <p>פורסם ציון עבור "${submissionName}", ניתן לראות את הציון בעמוד ההגשות.</p>
                  <p>לחץ על הכפתור למעבר לעמוד ההגשות:</p>
                  <p style="text-align: center">
                    <a
                      href="${process.env.FRONTEND_URL}/my-submissions"
                      style="
                        display: inline-block;
                        padding: 10px 15px;
                        background-color: #007bff;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 3px;
                      ">
                      מעבר לעמוד ההגשות
                    </a>
                  </p>
                </div>
              </body>
              </html>
            `,
          };

          transporter.sendMail(mailOptions, (error) => {
            if (error) {
              console.error("Error sending email to:", email, error);
            }
          });
        })
      );

      // Wait for 11 seconds before sending the next batch
      await new Promise((resolve) => setTimeout(resolve, 11000));
    }
  } catch (error) {
    console.error("Error in sendGradesEmail:", error);
  }
};
