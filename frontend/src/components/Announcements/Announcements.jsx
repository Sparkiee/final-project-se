import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Announcements.scss";
import { Editor } from "primereact/editor";
import { Button, message, Checkbox, Input, Select } from "antd";
import AnnouncementMessage from "./AnnouncementMessage";

const Announcements = () => {
  const [privileges, setPrivileges] = useState({ isStudent: false, isAdvisor: false, isCoordinator: false });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRoles, setSelectedRoles] = useState({
    student: false,
    advisor: false,
    judge: false,
    coordinator: false,
  });
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groups, setGroups] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const fetchPrivileges = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/privileges`, {
        withCredentials: true,
      });
      setPrivileges(response.data);
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/group/get-current-year`, {
        withCredentials: true,
      });
      setGroups(response.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/announcement/get-all`, {
        withCredentials: true,
      });
      setAnnouncements(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchPrivileges();
    fetchGroups();
  }, []);

  const submitAnnouncement = async () => {
    try {
      axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/announcement/create`,
        {
          title,
          description,
          ...(selectedGroup !== "" && { group: selectedGroup }),
          ...(Object.values(selectedRoles).some((role) => role === true) && { roles: selectedRoles }),
        },
        {
          withCredentials: true,
        },
      );

      message.success("ההודעה נוצרה בהצלחה");
    } catch (error) {
      console.error("Error occurred:", error);
    } finally {
      setTitle("");
      setDescription("");
      fetchAnnouncements();
    }
  };

  const handleEditorChange = (e) => {
    setDescription(e.htmlValue || "");
  };

  const roleOptions = [
    { label: "סטודנט", value: "student" },
    { label: "מנחה", value: "advisor" },
    { label: "שופט", value: "judge" },
    { label: "רכז", value: "coordinator" },
  ];

  return (
    <div className="announcements-container">
      {privileges.isCoordinator && (
        <div className="create-announcement">
          <h2>כתיבת הודעה חדשה</h2>
          <div className="form-input-group">
            <label htmlFor="announcement-title">כותרת</label>
            <Input
              type="text"
              id="announcement-title"
              placeholder="כותרת"
              rules={[{ required: true, message: "שדה חובה" }]}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label htmlFor="announcement-roles">למי נשלחת ההודעה</label>
            <Checkbox.Group
              id="announcement-roles"
              options={roleOptions}
              value={Object.keys(selectedRoles).filter((role) => selectedRoles[role])}
              onChange={(checkedValues) => {
                const newRoles = {
                  student: checkedValues.includes("student"),
                  advisor: checkedValues.includes("advisor"),
                  judge: checkedValues.includes("judge"),
                  coordinator: checkedValues.includes("coordinator"),
                };
                console.log("Changing roles:", newRoles);
                setSelectedRoles(newRoles);
              }}
            />
            <label htmlFor="announcement-group">קבוצה (במידה ולא תבחר קבוצה ההודעה תשלח לכולם)</label>
            <Select
              id="announcement-group"
              value={selectedGroup}
              options={[
                { label: "ללא בחירה", value: "" }, // Add an empty option
                ...groups.map((group) => ({
                  label: group.name,
                  value: group._id,
                })),
              ]}
              onChange={(value) => setSelectedGroup(value)}
              placeholder="בחר קבוצה"
            />
          </div>

          <div className="form-input-group template-input-group">
            <Editor
              placeholder="תיאור לקובץ"
              value={description}
              onTextChange={handleEditorChange}
              style={{ height: "320px", wordBreak: "break-word" }}
            />
          </div>
          <Button
            type="primary"
            onClick={submitAnnouncement}
            disabled={description === "" || title === ""}
            style={{ marginTop: 16 }}>
            פרסם הודעה
          </Button>
        </div>
      )}
      <h2>הודעות</h2>
      <div class="announcements-board">
        {announcements.map((announcement) => (
          <AnnouncementMessage key={announcement._id} announcement={announcement} />
        ))}
      </div>
    </div>
  );
};

export default Announcements;
