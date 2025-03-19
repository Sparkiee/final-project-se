import Mission from "../models/mission.js";
import Project from "../models/projects.js";
import Notification from "../models/notifications.js";

// Create a new mission
export const createMission = async (req, res) => {
  try {
    const { projectId, assignees = [], ...missionData } = req.body;
    // Create the new mission
    const mission = new Mission({ ...missionData, assignees });
    await mission.save();

    // Find the project and update its journal
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    project.journal.missions.push(mission._id);
    await project.save();

    // Send notifications to assignees
    if (assignees.length > 0) {
      const notifications = assignees
        .filter((assigneeId) => assigneeId.toString() !== mission.author.toString())
        .map((assigneeId) => ({
          user: assigneeId,
          message: `משימה חדשה: ${mission.name}`,
        }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json(mission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all missions
export const getMissions = async (req, res) => {
  try {
    const missions = await Mission.find().populate("journal author assignees files");
    res.status(200).json(missions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get a single mission by ID
export const getMissionById = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id).populate("journal author assignees files");
    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }
    res.status(200).json(mission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getMissionsByProjectId = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate({
      path: "journal.missions",
      populate: [
        {
          path: "assignees",
          model: "User",
          select: "name",
        },
        {
          path: "author",
          model: "User",
          select: "name",
        },
      ],
    });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const { missions } = project.journal;
    res.status(200).json({ missions });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a mission by ID
export const updateMission = async (req, res) => {
  try {
    const mission = await Mission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }

    // Check if the mission is completed
    if (req.body.isCompleted) {
      const notifications = mission.assignees
        .filter(
          (assigneeId) =>
            assigneeId.toString() !== req.user._id.toString() && assigneeId.toString() !== mission.author.toString()
        )
        .map((assigneeId) => ({
          user: assigneeId,
          message: `משימה הושלמה: ${mission.name}`,
        }));

      // Add notification for the author if they are not the one marking it as complete
      if (mission.author.toString() !== req.user._id.toString()) {
        notifications.push({
          user: mission.author,
          message: `משימה הושלמה: ${mission.name}`,
        });
      }

      await Notification.insertMany(notifications);
    }

    res.status(200).json(mission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a mission by ID
export const deleteMission = async (req, res) => {
  try {
    const mission = await Mission.findByIdAndDelete(req.params.id);
    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }
    res.status(200).json({ message: "Mission deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
