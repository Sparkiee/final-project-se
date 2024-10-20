import React, { useState, useEffect } from "react";
import "./Templates.scss";
import axios from "axios";
import DownloadFile from "../DownloadFile/DownloadFile";
import { InboxOutlined } from "@ant-design/icons";
import { Button, message, Upload, Collapse } from "antd";

const Templates = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privileges, setPrivileges] = useState({ isStudent: false, isAdvisor: false, isCoordinator: false });
  const [templateFiles, setTemplateFiles] = useState([]);
  const { Dragger } = Upload;

  useEffect(() => {
    const fetchPrivileges = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/user/privileges", { withCredentials: true });
        setPrivileges(response.data);
      } catch (error) {
        console.error("Error occurred:", error);
      }
    };

    const fetchTemplateFiles = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/file-templates", { withCredentials: true });
        setTemplateFiles(response.data);
      } catch (error) {
        console.error("Error fetching template files:", error);
      }
    };

    fetchPrivileges();
    fetchTemplateFiles();
  }, []);

  const handleUpload = async () => {
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("title", title);
    formData.append("description", description);
    setUploading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/file-templates", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setFileList([]);
      message.success("upload successfully.");
      // Refresh the template files list after successful upload
      const updatedFiles = await axios.get("http://localhost:5000/api/file-templates", { withCredentials: true });
      setTemplateFiles(updatedFiles.data);
    } catch (error) {
      console.error("Error occurred:", error);
      message.error("upload failed.");
    } finally {
      setUploading(false);
      clearForm();
    }
  };

  const props = {
    multiple: true,
    maxCount: 10,
    listType: "picture",
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file, fileListNew) => {
      // Check if file with same name already exists
      const isDuplicate = fileList.some((existingFile) => existingFile.name === file.name);
      if (isDuplicate) {
        message.error(`קובץ "${file.name}" כבר קיים`);
        return Upload.LIST_IGNORE;
      }

      if (fileList.length + fileListNew.length > 10) {
        message.error("You can only upload up to 10 files!");
        return Upload.LIST_IGNORE;
      }
      setFileList((prevList) => [...prevList, file]);
      return false;
    },
    fileList,
  };

  const clearForm = () => {
    setFileList([]);
    setTitle("");
    setDescription("");
  };

  return (
    <div>
      {privileges.isCoordinator && (
        <div className="upload-container">
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">לחצו או גררו כדי להעלות קבצים</p>
            <p className="ant-upload-hint">
              ניתן להעלות עד 10 קבצים בו זמנית (הזנת כותרת/תיאור ישוייכו לכל הקבצים אם הועלאו ביחד)
            </p>
          </Dragger>
          <hr />
          <div className="form-input-group template-input-group">
            <label htmlFor="title">כותרת</label>
            <input
              type="text"
              id="title"
              placeholder="כותרת לקובץ (אם לא הוכנס שם הקובץ יהיה גם הכותרת)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-input-group template-input-group">
            <label htmlFor="description">תיאור</label>
            <textarea
              id="description"
              placeholder="תיאור לקובץ"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button
            type="primary"
            onClick={handleUpload}
            disabled={fileList.length === 0}
            loading={uploading}
            style={{ marginTop: 16 }}>
            {uploading ? "מעלה" : "התחל העלאה"}
          </Button>
          <div className="template-content">
            <Collapse
              size="large"
              items={[
                {
                  key: "1",
                  label: "כותרת הקובץ",
                  children: <p>something</p>,
                },
              ]}
            />
            {templateFiles.map((file) => (
              <DownloadFile key={file._id} file={file} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;
