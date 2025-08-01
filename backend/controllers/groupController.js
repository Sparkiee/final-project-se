import Group from "../models/groups.js";
import Config from "../models/config.js";

export const createNewGroup = async (req, res) => {
  try {
    const { name, projects, year } = req.body;
    const existingGroup = await Group.findOne({ name, year });
    if (existingGroup) {
      return res.status(400).json({ error: "Group with the same name already exists for the selected year" });
    }
    const newGroup = new Group({ name, projects, year });
    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getYearGroups = async (req, res) => {
  try {
    const config = await Config.findOne();
    const groups = await Group.find({ year: config.currentYear });
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGroupByYear = async (req, res) => {
  try {
    const { year } = req.params;
    const groups = await Group.find({ year });
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const renameGroup = async (req, res) => {
  try {
    const { groupId, newName } = req.body;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    group.name = newName;
    await group.save();
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addProjects = async (req, res) => {
  try {
    const { groupId, projectIds } = req.body;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    group.projects.push(...projectIds);
    await group.save();
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeProjects = async (req, res) => {
  try {
    const { groupId, projectIds } = req.body;
    const group = await Group.findById(groupId).populate("projects");
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    group.projects = group.projects.filter((project) => !projectIds.includes(project._id.toString()));
    await group.save();
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const group = await Group.findByIdAndDelete(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGroupProjects = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate({ path: "projects", populate: { path: "students advisors" } });
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.status(200).json(group.projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
