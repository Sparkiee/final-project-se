import React, { useEffect, useState, useRef, forwardRef, useContext } from "react";
import { Badge, Table, Tooltip, Modal, Upload, message, Divider } from "antd";
import { UploadOutlined, DeleteOutlined, InboxOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import axios from "axios";
import "./UploadSubmissions.scss";
import { getColumnSearchProps as getColumnSearchPropsUtil } from "../../utils/tableUtils";
import { downloadFile } from "../../utils/downloadFile";
import { NotificationsContext } from "../../context/NotificationsContext";

const SafeTooltip = forwardRef(({ title, children }, ref) => (
  <Tooltip title={title}>
    <span ref={ref}>{children}</span>
  </Tooltip>
));

const UploadSubmissions = () => {
  const { fetchNotifications } = useContext(NotificationsContext);
  const [submissions, setSubmissions] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const [gradeInfo, setGradeInfo] = useState(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showUploadModal = (sub) => {
    setCurrentSubmission(sub);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setFile(null); // Clear the file state when closing the modal
    setFileList([]); // Clear the file list
  };

  const showConfirmModal = (sub) => {
    setCurrentSubmission(sub);
    setIsConfirmModalVisible(true);
  };

  const { Dragger } = Upload;

  const props = {
    name: "file",
    multiple: false,
    accept: ".pdf",
    listType: "picture",
    fileList, // Bind the fileList state
    beforeUpload: (file) => {
      if (file.name.length > 50) {
        message.error(`שם קובץ יכול להכיל עד 50 תווים (רווח גם נחשב כתו)`);
        return Upload.LIST_IGNORE;
      }

      if (!file.type.includes("pdf")) {
        message.error("יש להעלות קובץ מסוג PDF בלבד");
        return Upload.LIST_IGNORE;
      }

      setFile(file); // Store the file
      setFileList([file]); // Update the file list
      return false; // Prevent auto-upload
    },
    onRemove: () => {
      setFile(null); // Clear the selected file
      setFileList([]); // Clear the file list
      message.info("הקובץ הוסר");
    },
    onChange: (info) => {
      const { fileList: newFileList } = info;
      setFileList(newFileList); // Update file list
    },
  };

  const confirmDeleteSubmission = async () => {
    try {
      // Send POST request to delete the file & remove its' schema reference
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/uploads/delete/${currentSubmission.file}?destination=submissions`,
        { withCredentials: true }
      );
      // POST request to remove file form submission schema
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/update-submission-file/${currentSubmission._id}`,
        {
          file: null,
          sentFromDelete: true,
        },
        { withCredentials: true }
      );
      const submissionsUpdated = submissions.map((submission) =>
        submission._id === currentSubmission._id ? { ...submission, file: null } : submission
      );
      setSubmissions(submissionsUpdated);
      message.info(`הגשה עבור ${currentSubmission.name} נמחקה בהצלחה`);
      setIsConfirmModalVisible(false);
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPendingSubmissions = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/submission/get-student-submissions`, {
        withCredentials: true,
      });
      const data = response.data || [];
      if (data.message === "No project found") {
        setSubmissions([]);
        return;
      } else if (!Array.isArray(data)) {
        throw new Error("Invalid data format");
      }

      const submissionsWithProjectNames = await Promise.all(
        data.map(async (submission) => {
          const projectResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/api/project/get-project/${submission.project}`,
            { withCredentials: true }
          );
          const projectName = projectResponse.data.title;
          return { ...submission, projectName };
        })
      );
      setSubmissions(submissionsWithProjectNames);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setSubmissions([]);
    }
  };

  useEffect(() => {
    fetchPendingSubmissions();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      message.error("לא נבחר קובץ להעלאה");
      return;
    }

    const formData = new FormData();
    let projectName = currentSubmission.projectName;
    let fileName = file.name;

    // Ensure the combined length does not exceed 50 characters
    const maxLength = 50;
    const combinedLength = `${projectName}-${fileName}`.length;
    if (combinedLength > maxLength) {
      const excessLength = combinedLength - maxLength;
      if (projectName.length > excessLength) {
        projectName = projectName.substring(0, projectName.length - excessLength);
      } else {
        fileName = fileName.substring(0, fileName.length - excessLength);
      }
      message.warning(`שם הקובץ קוצר ל-${maxLength} תווים`);
    }

    const fileNameWithProject = `${projectName}-${fileName}`;

    formData.append("files", file, encodeURIComponent(fileNameWithProject));
    formData.append("title", "");
    formData.append("description", "");
    formData.append("destination", "submissions"); // Set destination for dynamic pathing

    setUploading(true);

    try {
      // Send POST request to upload the file
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/uploads?destination=submissions`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-Filename-Encoding": "url",
          },
          withCredentials: true,
        }
      );
      // Show success message and reset file
      const uploadedFile = response.data.files[0]._id;

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/update-submission-file/${currentSubmission._id}`,
        {
          file: uploadedFile,
        },
        { withCredentials: true }
      );

      fetchPendingSubmissions();
      setFile(null); // Clear the selected file
      closeModal(); // Close the modal
      message.success(`הגשה עבור ${currentSubmission.name} הועלתה בהצלחה`);
      fetchNotifications();
    } catch (error) {
      console.error("Error occurred:", error);
      if (error.response?.status === 500 || error.response?.status === 409) {
        message.error("קובץ עם שם זה כבר קיים");
      } else {
        message.error("העלאת הקובץ נכשלה");
      }
    } finally {
      setUploading(false); // Reset uploading state
    }
  };

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (dataIndex) =>
    getColumnSearchPropsUtil(dataIndex, searchInput, handleSearch, handleReset, searchText);

  const columns = [
    {
      title: "שם ההגשה",
      dataIndex: "submissionName",
      key: "submissionName",
      fixed: windowSize.width > 626 && "left",
      ...getColumnSearchProps("submissionName"),
      render: (text) => (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ),
      width: windowSize.width > 1024 ? "27.5%" : windowSize.width / 3,
    },
    {
      title: "תאריך הגשה",
      dataIndex: "submissionDate",
      key: "submissionDate",
      fixed: windowSize.width > 626 && "left",
      render: (text, record) => {
        const submissionDate = new Date(record.submissionDate);
        const isPastDue = submissionDate < new Date();
        const isDateClose = submissionDate - new Date() < 2 * 24 * 60 * 60 * 1000;
        return (
          <SafeTooltip
            title={`${
              record.fileNeeded && !record.file && isPastDue
                ? "תאריך ההגשה עבר, ההגשה באיחור"
                : record.fileNeeded && !record.file && isDateClose
                ? "תאריך הגשה מתקרב"
                : ""
            }`}>
            <span
              style={{
                color:
                  record.fileNeeded && !record.file && isPastDue
                    ? "red"
                    : record.fileNeeded && !record.file && isDateClose
                    ? "#f58623"
                    : "inherit",
                fontWeight: record.fileNeeded && !record.file && (isPastDue || isDateClose) ? "bold" : "normal",
              }}>
              {submissionDate.toLocaleString("he-IL", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </SafeTooltip>
        );
      },
      sorter: (a, b) => {
        return new Date(a.submissionDate) - new Date(b.submissionDate);
      },
      defaultSortOrder: "ascend",
      sortDirections: ["descend", "ascend"],
      width: windowSize.width > 1024 ? "15%" : 200,
    },
    {
      title: "סטטוס הגשה",
      dataIndex: "submissionsStatus",
      key: "submissionsStatus",
      render: (_, record) => {
        const isLate = new Date(record.submissionDate) < new Date(record.uploadDate);
        const days = Math.ceil((new Date(record.uploadDate) - new Date(record.submissionDate)) / (1000 * 60 * 60 * 24));
        return (
          <span>
            {record.fileNeeded ? (
              record.file ? (
                isLate ? (
                  <SafeTooltip title={`2 נקודות קנס על כל יום איחור - סה"כ ${days * 2} נקודות`}>
                    <Badge color={"darkgreen"} text={`הוגש באיחור - ${days} ימים`} />
                  </SafeTooltip>
                ) : (
                  <Badge color={"green"} text={"הוגש"} />
                )
              ) : (
                <Badge color="orange" text="לא הוגש" />
              )
            ) : (
              <Badge color="green" text="לא נדרש קובץ" />
            )}
          </span>
        );
      },
      filters: [
        {
          text: "הוגש",
          value: "הוגש",
        },
        {
          text: "לא הוגש",
          value: "לא הוגש",
        },
        {
          text: "לא נדרש קובץ",
          value: "לא נדרש קובץ",
        },
      ],
      onFilter: (value, record) => {
        if (value === "הוגש") {
          return record.file;
        }
        if (value === "לא הוגש") {
          return !record.file && record.fileNeeded;
        }
        return !record.fileNeeded;
      },
      width: windowSize.width > 626 ? "17.5%" : 300,
    },
    {
      title: "הנחיות",
      dataIndex: "submissionInfo",
      key: "info",
      render: (text) => {
        return <Tooltip title={text}>{text.length > 45 ? `${text.slice(0, 45)}...` : text}</Tooltip>;
      },
      filters: [
        {
          text: "יש הנחיות",
          value: "יש הנחיות",
        },
        {
          text: "אין הנחיות",
          value: "אין הנחיות",
        },
      ],
      onFilter: (value, record) => {
        if (value === "יש הנחיות") {
          return record.submissionInfo;
        }
        return !record.submissionInfo;
      },

      width: "25%",
    },
    {
      title: "פעולות",
      key: "action",
      render: (text, record) => (
        <span>
          {!record.file && record.fileNeeded ? (
            <a>
              <UploadOutlined className="edit-icon" onClick={() => showUploadModal(record)} />
            </a>
          ) : new Date(record.submissionDate) > new Date() && record.fileNeeded ? (
            <div className="icon-group">
              <a>
                <DownloadOutlined className="edit-icon" onClick={() => downloadFile(record.file, "submissions")} />
              </a>
              <a>
                <DeleteOutlined className="edit-icon" onClick={() => showConfirmModal(record)} />
              </a>
            </div>
          ) : record.editable === false ? (
            <a>
              <Tooltip title="לצפיה בציון">
                <EyeOutlined
                  className="edit-icon"
                  onClick={() => {
                    setGradeInfo(record);
                  }}
                />
              </Tooltip>
            </a>
          ) : record.fileNeeded ? (
            <span>
              תאריך הגשה עבר <br />
              <Tooltip title="לחץ להורדת קובץ מקור">
                <a style={{ fontWeight: "bold" }} onClick={() => downloadFile(record.file, "submissions")}>
                  הורדת קובץ מקור
                </a>
              </Tooltip>
            </span>
          ) : (
            <span>הגשה ללא קובץ</span>
          )}
        </span>
      ),
      width: windowSize.width > 1024 ? "15%" : 200,
    },
  ];

  return (
    <div>
      <Modal
        title={`צפיה בציון`}
        open={gradeInfo != null}
        width={
          windowSize.width > 1600
            ? "40%"
            : windowSize.width > 1200
            ? "50%"
            : windowSize.width > 1024
            ? "65%"
            : windowSize.width > 768
            ? "80%"
            : "90%"
        }
        cancelText="סגור"
        onCancel={() => setGradeInfo(null)}
        okButtonProps={{ style: { display: "none" } }}>
        <div className="grade-info">
          <h3 style={{ color: "red", fontWeight: "bold" }}>שיבו לב - הציון הינו סופי ולא ניתן לערעור</h3>
          <div className="detail-item">
            <div className="detail-item-header">שם הפרויקט:</div>
            <div className="detail-item-content">{gradeInfo?.projectName}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-header">שם ההגשה:</div>
            <div className="detail-item-content">{gradeInfo?.submissionName}</div>
          </div>
          {gradeInfo?.isGraded && (
            <>
              <div className="detail-item">
                <div className="detail-item-header">ציון סופי:</div>
                <div
                  className="detail-item-content"
                  style={{
                    color: gradeInfo?.finalGrade >= 55 ? "darkgreen" : "red",
                    fontWeight: "bold",
                  }}>
                  {gradeInfo?.finalGrade}
                </div>
              </div>
              {Math.ceil(
                (new Date(gradeInfo?.uploadDate) - new Date(gradeInfo?.submissionDate)) / (1000 * 60 * 60 * 24)
              ) > 0 && (
                <Tooltip title="2 נקודות על כל יום איחור" placement="rightTop">
                  <div className="detail-item">
                    <div className="detail-item-header">נקודות קנס:</div>
                    <div className="detail-item-content" style={{ color: "red", fontWeight: "bold" }}>
                      {Math.ceil(
                        (new Date(gradeInfo?.uploadDate) - new Date(gradeInfo?.submissionDate)) / (1000 * 60 * 60 * 24)
                      ) * 2}
                    </div>
                  </div>
                </Tooltip>
              )}
            </>
          )}
          <Divider />
          {gradeInfo?.isReviewed && (
            <div className="reviews">
              {gradeInfo.grades.map((grade, index) => (
                <div className="review-container" key={index}>
                  <div className="review">
                    <div className="review-title">משוב ע"י שופט {index + 1}</div>
                    <div className="review-item">
                      <div className="review-header">משוב איכות הכתיבה:</div>
                      <div className="review-content">{grade?.videoQuality}</div>
                    </div>
                    <div className="review-item">
                      <div className="review-header">משוב איכות העבודה:</div>
                      <div className="review-content">{grade?.workQuality}</div>
                    </div>
                    <div className="review-item">
                      <div className="review-header">משוב איכות הכתיבה:</div>
                      <div className="review-content">{grade?.writingQuality}</div>
                    </div>
                  </div>
                  {index !== gradeInfo.grades.length - 1 && gradeInfo.grades.length > 1 && (
                    <Divider
                      type={windowSize.width > 626 ? "vertical" : "horizontal"}
                      style={{ height: windowSize.width > 626 && "100%", margin: windowSize.width > 626 && "0 5px" }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
      <Modal
        title={`מחיקת הגשה עבור ${currentSubmission?.name}`}
        open={isConfirmModalVisible}
        width={
          windowSize.width > 1600
            ? "15%"
            : windowSize.width > 1200
            ? "25%"
            : windowSize.width > 1024
            ? "30%"
            : windowSize.width > 768
            ? "40%"
            : windowSize.width > 626
            ? "50%"
            : "90%"
        }
        okText="אשר מחיקה"
        okButtonProps={{ danger: true }}
        cancelText="סגור"
        onOk={() => confirmDeleteSubmission()}
        onCancel={() => setIsConfirmModalVisible(false)}>
        האם אתה בטוח שברצונך למחוק את ההגשה?
      </Modal>
      <Modal
        title={`הגשת מטלה - ${currentSubmission?.name}`}
        open={isModalVisible}
        onCancel={closeModal}
        onOk={handleUpload}
        okText="העלה הגשה"
        cancelText="ביטול"
        okButtonProps={{ disabled: !file }}
        width={
          windowSize.width > 1600
            ? "30%"
            : windowSize.width > 1200
            ? "50%"
            : windowSize.width > 1024
            ? "60%"
            : windowSize.width > 768
            ? "80%"
            : "90%"
        }>
        <div className="submission-modal">
          {currentSubmission?.submissionInfo && (
            <div className="submission-info">
              <b>הנחיות</b>: {currentSubmission.submissionInfo}
            </div>
          )}
          {new Date(currentSubmission?.submissionDate) < new Date() && (
            <div className="submission-late">
              <b>
                שימו לב - ההגשה נשלחת באיחור
                <br /> לכן, לא ניתן יהיה לבצע{" "}
                <Tooltip title="שינויים כגון: למחוק • לערוך • להגיש מחדש">
                  <span className="upload-warning">שינויים נוספים</span>
                </Tooltip>{" "}
                לאחר ההגשה
              </b>
            </div>
          )}
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">לחצו או גררו כדי להעלות קובץ</p>
            <p className="ant-upload-hint">
              עבור פרויקטים בזוגות רק על אחד השותפים להגיש את הנדרש. שימו לב שיש להגיש בקובץ PDF בלבד
            </p>
          </Dragger>
        </div>
      </Modal>
      <Table
        dataSource={submissions}
        columns={columns}
        scroll={{
          x: "max-content",
        }}
      />
    </div>
  );
};

export default UploadSubmissions;
