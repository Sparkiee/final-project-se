import React, { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Highlighter from "react-highlight-words";
import { handleMouseDown } from "../../utils/mouseDown";
import axios from "axios";
import dayjs from "dayjs";
import "./Submissions.scss";
import { Progress } from "antd";
import {
  Modal,
  DatePicker,
  Form,
  Input,
  Select,
  Table,
  Radio,
  message,
  Checkbox,
  Button,
  InputNumber,
  Badge,
  Space,
  Divider,
  Tooltip,
  TimePicker,
} from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined, UserSwitchOutlined } from "@ant-design/icons";
import locale from "antd/es/date-picker/locale/he_IL"; // Import Hebrew locale
import { getColumnSearchProps as getColumnSearchPropsUtil } from "../../utils/tableUtils";
import { NotificationsContext } from "../../utils/NotificationsContext";
import { downloadFile } from "../../utils/downloadFile";
import { toJewishDate, formatJewishDateInHebrew } from "jewish-date";

const Submissions = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : {};
  });
  const { TextArea } = Input;
  const { Option } = Select;
  const { fetchNotifications } = useContext(NotificationsContext);
  const [formAll] = Form.useForm();
  const [editSubmission] = Form.useForm();
  const [judgeAssignmentForm] = Form.useForm();
  const [editSpecificSubmission] = Form.useForm();
  const [formSpecific] = Form.useForm();
  const [gradeForm] = Form.useForm();
  const [deleteSubmissionsForm] = Form.useForm();
  const [deleteJudgesForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [assignJudgesModal, setAssignJudgesModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [allSubmissions, setAllSubmissions] = useState(false);
  const [specificSubmission, setSpecificSubmission] = useState(false);
  const [editSubmissions, setEditSubmissions] = useState(false);
  const [gradeFormOpen, setGradeFormOpen] = useState(false);
  const [gradeToOverride, setGradeToOverride] = useState(null);
  const [submissionData, setSubmissionData] = useState([]);
  const [submissionDetails, setSubmissionDetails] = useState([]);
  const [submissionType, setSubmissionType] = useState("proposalReport");
  const [showReview, setShowReview] = useState(null);
  const [deleteAllSubmissions, setDeleteAllSubmissions] = useState(false);
  const [deleteAllSubmissionsConfirm, setDeleteAllSubmissionsConfirm] = useState(null);
  const [deleteAllJudgesConfirm, setDeleteAllJudgesConfirm] = useState(null);
  const [deleteSubmission, setDeleteSubmission] = useState(null);
  const [deleteJudges, setDeleteJudges] = useState(false);
  const [projects, setProjects] = useState([]);
  const [submissionInfo, setSubmissionInfo] = useState(null);
  const [specificSubmissionInfo, setSpecificSubmissionInfo] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const [yearFilter, setYearFilter] = useState("all");
  const [years, setYears] = useState([]);
  const [groups, setGroups] = useState([]);
  const [judges, setJudges] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedGroupSubmissions, setSelectedGroupSubmissions] = useState([]);
  const [fileListModal, setFileListModal] = useState(false);
  const [submissionInfoModalData, setSubmissionInfoModalData] = useState([]);
  const [updateJudgesModal, setUpdateJudgesModal] = useState(false);
  const [judgeUpdateSubmission, setJudgeUpdateSubmission] = useState(null);
  const [submissionJudges, setSubmissionJudges] = useState([]);
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

  const fetchActiveProjects = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/project/get-active-projects`, {
        withCredentials: true,
      });
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchYears = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/project/years`, {
        withCredentials: true,
      });
      setYears(response.data.sort((a, b) => b.localeCompare(a)));
      const currentHebrewYear = formatJewishDateInHebrew(toJewishDate(new Date())).split(" ").pop().replace(/^ה/, "");
      const currentHebrewYearIndex = response.data.indexOf(currentHebrewYear);
      setYearFilter(currentHebrewYearIndex !== -1 ? response.data[currentHebrewYearIndex] : response.data[0]);
    } catch (error) {
      console.error("Error fetching years:", error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/get-all-project-submissions`,
        {
          withCredentials: true,
        }
      );
      response.data.map((project) => {
        project.submissions.map((submission) => {
          submission.isLate = new Date(submission.submissionDate) < new Date(submission.uploadDate);
          return submission;
        });
        return project;
      });
      setSubmissionData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setSubmissionData([]);
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/group/get`, {
        withCredentials: true,
      });
      setGroups(response.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchJudges = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/all-users`, {
        withCredentials: true,
      });

      const activeUsers = response.data.filter((user) => !user.suspended);
      setJudges(activeUsers.filter((user) => user.isJudge));
    } catch (error) {
      console.error("Error fetching judges:", error);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchActiveProjects();
    fetchYears();
    fetchGroups();
    fetchNotifications();
    fetchJudges();
  }, []);

  const handleResetJudges = async (values) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/submission/reset-all-judges`, {
        params: {
          submissionYear: yearFilter,
          submissionName: values.submissionName,
        },
        withCredentials: true,
      });
      message.open({
        type: "info",
        content: "השופטים אופסו בהצלחה",
      });
    } catch (error) {
      console.error("Error deleting judges:", error);
    } finally {
      setDeleteAllJudgesConfirm(null);
      fetchSubmissions();
    }
  };

  const assignJudgesAI = async (values) => {
    let loopCancel = false;
    try {
      const axiosPromise = axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/assign-judge-ai`,
        {
          submissionYear: yearFilter,
          submissionName: values.submissionName,
        },
        {
          withCredentials: true,
        }
      );

      // Start the progress loop
      for (let i = 0; i < 99; i++) {
        if (loopCancel) break;
        setTimeout(() => {
          setProgress(i);
        }, i * 80); // Adjust the delay incrementally for each iteration
      }

      // Wait for the axios post to complete
      await axiosPromise;
    } catch (error) {
      console.error("Error assigning judges automatically:", error);
      message.open({
        type: "error",
        content: "מחסור בשופטים להקצאה אוטומטית",
      });
    } finally {
      loopCancel = true;
      setProgress(100);
      fetchSubmissions();
      setAssignJudgesModal(false);
    }
  };

  const assignJudgesAutomatically = async (values) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/assign-judge-auto`,
        {
          submissionYear: yearFilter,
          submissionName: values.submissionName,
        },
        {
          withCredentials: true,
        }
      );
      message.open({
        type: "success",
        content: "השופטים הוקצו בהצלחה",
      });
    } catch (error) {
      console.error("Error assigning judges automatically:", error);
      message.open({
        type: "error",
        content: "מחסור בשופטים להקצאה אוטומטית",
      });
    } finally {
      fetchSubmissions();
      setAssignJudgesModal(false);
    }
  };

  const overrideGrade = async (values) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/grade/change-final-grade/${submissionInfo?.submission?.key}`,
        {
          newGrade: values.newGrade,
          comment: values.comment,
        },
        { withCredentials: true }
      );
      message.open({
        type: "success",
        content: "הציון עודכן בהצלחה",
      });
    } catch (error) {
      console.error("Error overriding grade:", error);
    } finally {
      gradeForm.resetFields();
      setGradeFormOpen(false);
      setSubmissionInfo(null);
      fetchSubmissions();
    }
  };

  const handleDeleteSpecific = async (values) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/delete-specific-submission/${values.submission.key}`,
        {
          withCredentials: true,
        }
      );
      message.open({
        type: "success",
        content: "הגשה נמחקה בהצלחה",
      });
      setDeleteSubmission(null);
      setSubmissionInfo(null);
    } catch (error) {
      console.error("Error deleting submission:", error);
    } finally {
      fetchSubmissions();
    }
  };
  const handleOkDelete = async (values) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/delete-active-submissions`,
        {
          submissionName: values.submissionName,
          submissionYear: yearFilter,
          groups: [selectedGroupSubmissions],
        },
        {
          withCredentials: true,
        }
      );
      message.open({
        type: "success",
        content: "הגשות נמחקו בהצלחה",
      });
      setDeleteAllSubmissionsConfirm(null);
      setDeleteAllSubmissions(false);
    } catch (error) {
      console.error("Error deleting submissions:", error);
    } finally {
      fetchSubmissions();
      setSelectedGroupSubmissions([]);
    }
  };
  const handleOkAll = async (values) => {
    try {
      let name = "";
      let isGraded = false;
      let isReviewed = false;
      let fileNeeded = false;
      let noJudges = false;
      switch (submissionType) {
        case "proposalReport":
          name = "דוח הצעה";
          isGraded = submissionOptions.find((option) => option.value === "proposalReport").isGraded;
          isReviewed = submissionOptions.find((option) => option.value === "proposalReport").isReviewed;
          fileNeeded = submissionOptions.find((option) => option.value === "proposalReport").fileNeeded;
          break;
        case "alphaReport":
          name = "דוח אלפה";
          isGraded = submissionOptions.find((option) => option.value === "alphaReport").isGraded;
          isReviewed = submissionOptions.find((option) => option.value === "alphaReport").isReviewed;
          fileNeeded = submissionOptions.find((option) => option.value === "alphaReport").fileNeeded;
          break;
        case "finalReport":
          name = "דוח סופי";
          isGraded = submissionOptions.find((option) => option.value === "finalReport").isGraded;
          isReviewed = submissionOptions.find((option) => option.value === "finalReport").isReviewed;
          fileNeeded = submissionOptions.find((option) => option.value === "finalReport").fileNeeded;
          break;
        case "finalExam":
          name = "מבחן סוף";
          isGraded = submissionOptions.find((option) => option.value === "finalExam").isGraded;
          isReviewed = submissionOptions.find((option) => option.value === "finalExam").isReviewed;
          fileNeeded = submissionOptions.find((option) => option.value === "finalExam").fileNeeded;
          break;
        default: // other...
          name = values.submissionName || "ללא שם";
          isGraded = Array.isArray(values.submissionChecklist)
            ? values.submissionChecklist.includes("isGraded")
            : false;
          isReviewed = Array.isArray(values.submissionChecklist)
            ? values.submissionChecklist.includes("isReviewed")
            : false;
          fileNeeded = Array.isArray(values.submissionChecklist)
            ? values.submissionChecklist.includes("fileNeeded")
            : false;
          noJudges = Array.isArray(values.submissionChecklist)
            ? values.submissionChecklist.includes("noJudges")
            : false;
          break;
      }
      let submissionDate = dayjs(values.submissionDate);
      if (windowSize.width < 500) {
        submissionDate = submissionDate
          .set({
            hour: values.submissionTime.hour(),
            minute: values.submissionTime.minute(),
          })
          .toISOString();
      } else {
        submissionDate = submissionDate.toISOString();
      }
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/create`,
        {
          name: name,
          submissionDate: submissionDate,
          submissionTime: values.submissionTime ? values.submissionTime.format("HH:mm") : null,
          submissionInfo: values.submissionInfo,
          submissionYear: yearFilter,
          isGraded: isGraded,
          isReviewed: isReviewed,
          fileNeeded: fileNeeded,
          noJudges: noJudges,
          currentUser: currentUser._id,
          groups: [selectedGroupSubmissions],
        },
        {
          withCredentials: true,
        }
      );
      message.open({
        type: "success",
        content: "הגשה נפתחה בהצלחה",
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error creating submission:", error);
    } finally {
      formAll.resetFields();
      setAllSubmissions(false);
      fetchSubmissions();
      setSubmissionType("proposalReport");
      setSelectedGroupSubmissions([]);
    }
  };

  const handleOkEditSpecific = async (values) => {
    try {
      let submissionDate = dayjs(values.submissionDate);
      if (windowSize.width < 500) {
        submissionDate = submissionDate
          .set({
            hour: values.submissionTime.hour(),
            minute: values.submissionTime.minute(),
          })
          .toISOString();
      } else {
        submissionDate = submissionDate.toISOString();
      }
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/update-specific-submission/${specificSubmissionInfo.submission.key}`,
        {
          name: values.submissionName,
          submissionDate: submissionDate,
          submissionTime: values.submissionTime ? values.submissionTime.format("HH:mm") : null,
          isGraded: Array.isArray(values.submissionChecklist) ? values.submissionChecklist.includes("isGraded") : false,
          isReviewed: Array.isArray(values.submissionChecklist)
            ? values.submissionChecklist.includes("isReviewed")
            : false,
          fileNeeded: Array.isArray(values.submissionChecklist)
            ? values.submissionChecklist.includes("fileNeeded")
            : false,
          noJudges: Array.isArray(values.submissionChecklist) ? values.submissionChecklist.includes("noJudges") : false,
        },
        {
          withCredentials: true,
        }
      );
      message.success(`ההגשה עודכנה בהצלחה!`);
    } catch (error) {
      console.error("Error updating submission:", error);
      message.error("שגיאה בעדכון ההגשה.");
    } finally {
      editSpecificSubmission.resetFields();
      setSpecificSubmissionInfo(null);
      fetchSubmissions();
    }
  };

  const handleOkEdit = async (values) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/update-submission-information`,
        {
          submissionOldName: values.submissionOldName,
          SubmissionName: values.SubmissionName,
          submissionDate: values.submissionDate,
          submissionInfo: values.submissionInfo,
          submissionYear: yearFilter,
          groups: [selectedGroupSubmissions],
        },
        {
          withCredentials: true,
        }
      );
      message.open({
        type: "success",
        content: "הגשה עודכנה בהצלחה",
      });
    } catch (error) {
      console.error("Error updating submission:", error);
    } finally {
      editSubmission.resetFields();
      setEditSubmissions(false);
      fetchSubmissions();
      setSelectedGroupSubmissions([]);
    }
  };

  const handleOkSpecific = async (values) => {
    try {
      let name = "";
      let isGraded = false;
      let isReviewed = false;
      let fileNeeded = false;
      let noJudges = false;
      switch (values.submissionType) {
        case "proposalReport":
          name = "דוח הצעה";
          isGraded = submissionOptions.find((option) => option.value === "proposalReport").isGraded;
          isReviewed = submissionOptions.find((option) => option.value === "proposalReport").isReviewed;
          fileNeeded = submissionOptions.find((option) => option.value === "proposalReport").fileNeeded;
          break;
        case "alphaReport":
          name = "דוח אלפה";
          isGraded = submissionOptions.find((option) => option.value === "alphaReport").isGraded;
          isReviewed = submissionOptions.find((option) => option.value === "alphaReport").isReviewed;
          fileNeeded = submissionOptions.find((option) => option.value === "proposalReport").fileNeeded;
          break;
        case "finalReport":
          name = "דוח סופי";
          isGraded = submissionOptions.find((option) => option.value === "finalReport").isGraded;
          isReviewed = submissionOptions.find((option) => option.value === "finalReport").isReviewed;
          fileNeeded = submissionOptions.find((option) => option.value === "proposalReport").fileNeeded;
          break;
        case "finalExam":
          name = "מבחן סוף";
          isGraded = submissionOptions.find((option) => option.value === "finalExam").isGraded;
          isReviewed = submissionOptions.find((option) => option.value === "finalExam").isReviewed;
          fileNeeded = submissionOptions.find((option) => option.value === "proposalReport").fileNeeded;
          break;
        default: // other...
          name = values.submissionName || "ללא שם";
          isGraded = Array.isArray(values.submissionChecklist)
            ? values.submissionChecklist.includes("isGraded")
            : false;
          isReviewed = Array.isArray(values.submissionChecklist)
            ? values.submissionChecklist.includes("isReviewed")
            : false;
          fileNeeded = Array.isArray(values.submissionChecklist)
            ? values.submissionChecklist.includes("fileNeeded")
            : false;
          noJudges = Array.isArray(values.submissionChecklist)
            ? values.submissionChecklist.includes("noJudges")
            : false;
          break;
      }
      let submissionDate = dayjs(values.submissionDate);
      if (windowSize.width < 500) {
        submissionDate = submissionDate
          .set({
            hour: values.submissionTime.hour(),
            minute: values.submissionTime.minute(),
          })
          .toISOString();
      } else {
        submissionDate = submissionDate.toISOString();
      }
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/create-specific`,
        {
          name: name,
          submissionDate: submissionDate,
          submissionTime: values.submissionTime ? values.submissionTime.format("HH:mm") : null,
          submissionInfo: values.submissionInfo,
          submissionYear: yearFilter,
          projects: values.projects,
          isGraded: isGraded,
          isReviewed: isReviewed,
          fileNeeded: fileNeeded,
          noJudges: noJudges,
          currentUser: currentUser._id,
        },
        {
          withCredentials: true,
        }
      );
      message.open({
        type: "success",
        content: "הגשה נפתחה בהצלחה",
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error creating submission:", error);
    } finally {
      formSpecific.resetFields();
      setSpecificSubmission(false);
      fetchSubmissions();
      setSubmissionType("proposalReport");
    }
  };

  const onOkHandlerSpecific = () => {
    formSpecific
      .validateFields()
      .then((values) => {
        if (windowSize.width < 500) {
          values.submissionDate = values.submissionDate
            .set({
              hour: values.submissionTime.hour(),
              minute: values.submissionTime.minute(),
            })
            .toISOString();
        }
        handleOkSpecific(values);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };
  const onOkHandlerAll = () => {
    formAll
      .validateFields()
      .then((values) => {
        if (windowSize.width < 500) {
          values.submissionDate = values.submissionDate
            .set({
              hour: values.submissionTime.hour(),
              minute: values.submissionTime.minute(),
            })
            .toISOString();
        }
        handleOkAll(values);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const onOkHandlerGrade = () => {
    gradeForm
      .validateFields()
      .then((values) => {
        overrideGrade(values);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const onOkHandlerEdit = () => {
    editSubmission
      .validateFields()
      .then((values) => {
        handleOkEdit(values);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
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
      title: "שם הפרויקט",
      dataIndex: "title",
      key: "title",
      fixed: windowSize.width > 626 && "left",
      ...getColumnSearchProps("title"),
      sorter: (a, b) => {
        // Safely handle undefined values in sorting
        const titleA = (a.title || "").toString();
        const titleB = (b.title || "").toString();
        return titleA.localeCompare(titleB);
      },
      sortDirections: ["descend", "ascend"],
      defaultSortOrder: "ascend",
      render: (text, record) => {
        // Ensure text exists before rendering Highlighter
        const title = record.title || "";
        const displayText =
          windowSize.width > 1200
            ? title.length > 65
              ? `${title.substring(0, 65)}...`
              : title
            : windowSize.width > 1024
            ? title.length > 45
              ? `${title.substring(0, 45)}...`
              : title
            : title.length > 35
            ? `${title.substring(0, 35)}...`
            : title;
        return (
          <a
            onClick={() => navigate(`/project/${record.projectid}`)}
            onMouseDown={(e) => handleMouseDown(e, `/project/${record.projectid}`)}>
            <Highlighter
              highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={displayText}
            />
          </a>
        );
      },
      width: (windowSize.width - 220) / 3,
    },
    {
      title: "הגשות",
      key: "submissions",
      render: (_, record) => {
        // Ensure submissions array exists
        const submissions = record.submissions || [];
        return (
          <div className="table-row">
            {submissions.map((sub, index) => {
              const grades = sub.grades || [];
              const waitingCheck =
                (sub.isGraded && grades.some((grade) => grade.grade === null)) ||
                (sub.isReviewed &&
                  grades.some(
                    (grade) =>
                      grade.videoQuality === undefined ||
                      grade.workQuality === undefined ||
                      grade.writingQuality === undefined
                  ));
              return (
                <div className="table-col-div" key={index}>
                  <div
                    className="table-col"
                    onClick={() => {
                      setSubmissionInfo({ project: record, submission: sub });
                    }}>
                    <div className="submission-title">
                      {(sub.name.length > 25 ? `${sub.name.substring(0, 25)}...` : sub.name) || ""}
                    </div>
                    <span className="submission-date-time">
                      <strong>הגשה עד:</strong>{" "}
                      {sub.submissionDate
                        ? new Date(sub.submissionDate).toLocaleString("he-IL", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : ""}
                    </span>
                    <div className="table-col-info">
                      {sub.fileNeeded ? (
                        <Badge
                          color={sub.submitted ? (sub.isLate ? "darkgreen" : "green") : "orange"}
                          text={
                            sub.submitted
                              ? `הוגש${
                                  sub.isLate
                                    ? ` באיחור - ${Math.ceil(
                                        (new Date(sub.uploadDate) - new Date(sub.submissionDate)) /
                                          (1000 * 60 * 60 * 24)
                                      )} ימים`
                                    : ""
                                }`
                              : "ממתין להגשה"
                          }
                        />
                      ) : (
                        <Badge color="green" text="לא נדרש קובץ" />
                      )}
                      {sub.submitted && sub.file && (
                        <Button
                          color="primary"
                          variant="filled"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (sub.gotExtraUpload) {
                              setFileListModal(true);
                              setSubmissionInfoModalData(sub);
                            } else {
                              downloadFile(sub.file._id, "submissions");
                            }
                          }}>
                          הורד הגשה
                        </Button>
                      )}
                      <div>
                        {waitingCheck && (sub.submitted || !sub.fileNeeded) ? (
                          <Badge color="blue" text="ממתין לבדיקה" />
                        ) : !waitingCheck &&
                          ((sub.isGraded && sub.finalGrade === null) || (sub.isReviewed && sub.editable === true)) ? (
                          <Badge color="purple" text="ממתין לפרסום" />
                        ) : (
                          !sub.editable &&
                          sub.isGraded &&
                          sub.finalGrade !== null &&
                          !waitingCheck && (
                            <Badge
                              color="pink"
                              text={`ציון סופי: ${
                                sub?.finalGrade !== undefined ? sub.finalGrade : sub?.overridden?.newGrade ?? 0
                              }`}
                            />
                          )
                        )}
                        {sub?.isReviewed && !sub?.isGraded && !sub.editable && <Badge color="pink" text="משוב פורסם" />}
                      </div>
                    </div>
                    {sub?.grades.length < 3 && (sub.isGraded || sub.isReviewed) && (
                      <Badge
                        color="red"
                        text={
                          <span style={{ color: "red" }}>
                            {sub?.grades.length === 1 ? "שופט אחד בלבד" : "שני שופטים בלבד"}
                          </span>
                        }
                      />
                    )}
                  </div>
                  {index !== submissions.length - 1 && submissions.length > 1 && (
                    <Divider type="vertical" style={{ height: "100%" }} />
                  )}
                </div>
              );
            })}
          </div>
        );
      },
    },
  ];

  const submissionOptions = [
    { label: "דוח הצעה", value: "proposalReport", isGraded: false, isReviewed: false, fileNeeded: true },
    { label: "דוח אלפה", value: "alphaReport", isGraded: true, isReviewed: true, fileNeeded: true },
    { label: "דוח סופי", value: "finalReport", isGraded: false, isReviewed: true, fileNeeded: true },
    { label: "מבחן סוף", value: "finalExam", isGraded: true, isReviewed: false, fileNeeded: false },
    { label: "אחר", value: "other" },
  ];

  const gradeColumns = [
    {
      title: "שופט",
      dataIndex: "judgeName",
      key: "judgeName",
    },
    {
      title: "ציון",
      dataIndex: "grade",
      key: "grade",
      render: (text, record) => (
        <Space className="grade-table">
          {record.isGraded ? (record.grade !== null ? record.grade : "טרם נבדק") : "לא נדרש ציון"}
        </Space>
      ),
    },
    {
      title: "משוב",
      dataIndex: "comments",
      key: "comments",
      render: (text, record) => (
        <Space>
          {record.isReviewed && !record.editable ? (
            record.videoQuality !== undefined &&
            record.workQuality !== undefined &&
            record.writingQuality !== undefined ? (
              <a href="#">
                <Tooltip title="לצפיה במשוב">
                  <EyeOutlined style={{ fontSize: "2.5rem" }} onClick={() => setShowReview(record)} />
                </Tooltip>
              </a>
            ) : (
              "ממתין למשוב"
            )
          ) : (
            <span>הגשה ללא משוב</span>
          )}
        </Space>
      ),
    },
  ];

  const filteredSubmissionData = submissionData.filter((project) => {
    return (
      (yearFilter === "all" || project.year === yearFilter) &&
      (selectedGroup === "all" || groups.find((group) => group._id === selectedGroup)?.projects.includes(project.key))
    );
  });

  const filterOption = (input, option) => {
    return option.children.toLowerCase().includes(input.toLowerCase());
  };

  const renderTextWithNewlines = (text) => {
    return text?.split("\n").map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  const handleUpdateJudge = async () => {
    if (submissionJudges.length > 3) {
      message.error("ניתן לבחור עד 3 שופטים בלבד");
      return;
    }
    const judgesIds = judgeUpdateSubmission?.submission?.grades.map((grade) => grade.judge);
    if (
      judgesIds.length === submissionJudges.length &&
      judgesIds.every((judgeId) => submissionJudges.includes(judgeId))
    ) {
      message.warning("לא בוצעו שינויים");
      return;
    }
    await axios.put(
      `${process.env.REACT_APP_BACKEND_URL}/api/submission/update-judges`,
      {
        submissionID: judgeUpdateSubmission?.submission?.submissionid,
        judges: submissionJudges,
      },
      { withCredentials: true }
    );
    setSubmissionData((prevData) =>
      prevData.map((project) => {
        return {
          ...project,
          submissions: project.submissions.map((submission) => {
            if (submission.submissionid === judgeUpdateSubmission.submission.submissionid) {
              // Ensure `grades` exists before filtering
              const updatedGrades = (submission.grades || []).filter((grade) => submissionJudges.includes(grade.judge));

              submissionJudges.forEach((judge) => {
                if (!updatedGrades.find((grade) => grade.judge === judge)) {
                  updatedGrades.push({
                    judge,
                    judgeName: judges.find((u) => u._id === judge)?.name || "Unknown",
                    grade: null,
                    comments: "",
                  });
                }
              });

              return { ...submission, grades: updatedGrades };
            }
            return submission;
          }),
        };
      })
    );
    setSubmissionInfo((prevInfo) => {
      if (prevInfo?.submission?.submissionid === judgeUpdateSubmission.submission.submissionid) {
        const updatedGrades = (prevInfo.submission.grades || []).filter((grade) =>
          submissionJudges.includes(grade.judge)
        );

        submissionJudges.forEach((judge) => {
          if (!updatedGrades.find((grade) => grade.judge === judge)) {
            updatedGrades.push({
              judge,
              judgeName: judges.find((u) => u._id === judge)?.name || "Unknown",
              grade: null,
              comments: "",
            });
          }
        });

        return {
          ...prevInfo,
          submission: {
            ...prevInfo.submission,
            grades: updatedGrades,
          },
        };
      }
      return prevInfo;
    });
    setUpdateJudgesModal(false);
    setSubmissionJudges([]);
    message.success("השופטים עודכנו בהצלחה");
  };

  return (
    <div>
      <div className="action-buttons">
        <Select value={yearFilter} onChange={setYearFilter} style={{ width: "200px" }}>
          <Select.Option value="all">כל השנים</Select.Option>
          {years.map((year) => (
            <Select.Option key={year} value={year}>
              {year}
            </Select.Option>
          ))}
        </Select>
        <Select value={selectedGroup} onChange={setSelectedGroup} style={{ width: "200px" }}>
          <Select.Option value="all">כולם</Select.Option>
          {groups
            .filter((group) => yearFilter === "all" || group.year === yearFilter)
            .map((group) => (
              <Select.Option key={group._id} value={group._id}>
                {group.name}
              </Select.Option>
            ))}
        </Select>
        <Button
          type="primary"
          onClick={() => {
            if (
              projects.filter((project) => project.students.length !== 0 && project.advisors.length !== 0).length === 0
            ) {
              message.open({
                type: "warning",
                content: "אין פרויקטים פעילים עם סטודנטים ומנחים",
              });
              return;
            }
            setAllSubmissions(true);
          }}>
          פתיחת הגשה חדשה
        </Button>
        <Button
          type="primary"
          onClick={() => {
            if (
              projects.filter((project) => project.students.length !== 0 && project.advisors.length !== 0).length === 0
            ) {
              message.open({
                type: "warning",
                content: "אין פרויקטים פעילים עם סטודנטים ומנחים",
              });
              return;
            }
            setSpecificSubmission(true);
          }}>
          פתיחת הגשה לפרויקטים נבחרים
        </Button>
        {/* work in progress, doesn't work */}
        <Button
          type="primary"
          onClick={() => {
            if (yearFilter === "all")
              return message.open({
                type: "warning",
                content: "יש לבחור שנה ספציפית",
              });
            setAssignJudgesModal(true);
          }}>
          הקצאת שופטים אוטומטית
        </Button>
        <div className="action-buttons-end">
          <Button type="primary" onClick={() => setEditSubmissions(true)}>
            עריכת הגשות
          </Button>
          <Button
            color="danger"
            variant="solid"
            onClick={() => {
              if (yearFilter === "all")
                return message.open({
                  type: "warning",
                  content: "יש לבחור שנה ספציפית",
                });
              setDeleteJudges(true);
            }}>
            איפוס שופטים
          </Button>
          <Button
            color="danger"
            variant="solid"
            onClick={() => {
              if (yearFilter === "all")
                return message.open({
                  type: "warning",
                  content: "יש לבחור שנה ספציפית",
                });
              setDeleteAllSubmissions(true);
            }}>
            מחיקת הגשות
          </Button>
        </div>
      </div>
      <Table columns={columns} dataSource={filteredSubmissionData} loading={loading} scroll={{ x: "max-content" }} />
      <Modal
        open={updateJudgesModal}
        onOk={handleUpdateJudge}
        title={`עדכון שופטים להגשה ${judgeUpdateSubmission?.submission?.name} של ${judgeUpdateSubmission?.project?.title}`}
        onCancel={() => setUpdateJudgesModal(false)}
        cancelText="ביטול"
        okText="עדכן שופטים"
        okButtonProps={{ disabled: submissionJudges.length > 3 }}>
        <div>
          <p>{`בחר עד 3 שופטים להגשה ${judgeUpdateSubmission?.submission?.name}`}</p>
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="בחר שופטים"
            value={submissionJudges}
            onChange={(value) => {
              setSubmissionJudges(value);
            }}
            options={judges.map((judge) => ({ label: judge.name, value: judge._id }))}
          />
        </div>
      </Modal>
      <Modal
        title={`אישור מחיקה`}
        open={deleteAllJudgesConfirm !== null}
        okText="מחק"
        cancelText="ביטול"
        okButtonProps={{ danger: true }}
        onOk={() => {
          handleResetJudges(deleteAllJudgesConfirm);
        }}
        onCancel={() => setDeleteAllJudgesConfirm(null)}>
        <>
          {"האם אתה בטוח שברצונך למחוק את כל ההגשות עם השם "}
          <span style={{ fontWeight: "500" }}>{deleteAllJudgesConfirm?.submissionName || "שם ברירת מחדל"}</span>
          {" מהשנה "}
          <span style={{ textDecoration: "underline" }}>{yearFilter || "שנה ברירת מחדל"}</span>
          {" ?"}
        </>
      </Modal>
      <Modal
        title="איפוס שופטים"
        open={deleteJudges}
        cancelText="בטל"
        okText="אשר מחיקה"
        okButtonProps={{ danger: true }}
        onCancel={() => {
          setDeleteJudges(false);
          deleteJudgesForm.resetFields();
        }}
        onOk={() => {
          deleteJudgesForm
            .validateFields()
            .then((values) => {
              setDeleteAllJudgesConfirm(values);
              setDeleteJudges(false);
              deleteJudgesForm.resetFields();
            })
            .catch((info) => {
              console.log("Validate Failed:", info);
            });
        }}>
        <Form layout="vertical" form={deleteJudgesForm}>
          <p>
            <span style={{ color: "red", fontWeight: 600 }}>שים לב</span> - האיפוס מוריד את כל השופטים עבור ההגשות מהשנה{" "}
            <Tooltip title="ניתן לשנות בחירה ב dropdown">
              <span style={{ textDecoration: "underline" }}>{yearFilter}</span>
            </Tooltip>
          </p>
          <Form.Item
            label="בחר הגשה"
            name="submissionName"
            hasFeedback
            rules={[
              {
                required: true,
                message: "חובה לבחור הגשה",
              },
            ]}>
            <Select placeholder="בחר הגשה">
              {submissionData
                .filter((project) => project.year === yearFilter)
                .flatMap((submission, projectIndex) =>
                  submission.submissions.map((sub) => ({
                    ...sub,
                    projectIndex, // Add the project index to maintain uniqueness
                  }))
                )
                .filter((sub) => sub.name)
                .filter((sub, index, array) => array.findIndex((item) => item.name === sub.name) === index)
                .map((sub) => (
                  <Option key={`${sub.name}-${sub.projectIndex}`} value={sub.name}>
                    {sub.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="הקצאת שופטים אוטומטית"
        open={assignJudgesModal}
        footer={
          <div className="modal-footer" key="footer">
            <Button
              key="back"
              type="default"
              onClick={() => {
                setAssignJudgesModal(false);
                judgeAssignmentForm.resetFields();
                setProgress(0);
              }}>
              סגור
            </Button>
            <div className="modal-footer-action">
              <Button
                key="extra1"
                type="primary"
                onClick={() => {
                  judgeAssignmentForm
                    .validateFields()
                    .then((values) => {
                      assignJudgesAutomatically(values);
                    })
                    .catch((errorInfo) => {
                      console.error("Validation failed:", errorInfo);
                    });
                }}>
                הקצאה רגילה
              </Button>

              <Button
                key="extra2"
                type="primary"
                onClick={() => {
                  judgeAssignmentForm
                    .validateFields()
                    .then((values) => {
                      assignJudgesAI(values);
                    })
                    .catch((errorInfo) => {
                      console.error("Validation failed:", errorInfo);
                    });
                }}>
                הקצאה חכמה
              </Button>
            </div>
          </div>
        }
        cancelText={"סגור"}
        onCancel={() => {
          setAssignJudgesModal(false);
          setProgress(0);
        }}
        onClose={() => {
          setProgress(0);
        }}
        okButtonProps={{ style: { display: "none" } }}>
        <Form layout="vertical" form={judgeAssignmentForm}>
          <p>
            <span style={{ color: "red", fontWeight: 600 }}>שים לב</span> - ההקצאה תתבצע לכל ההגשות בשנה הנבחרת{" "}
            <Tooltip title="ניתן לשנות בחירה ב dropdown">
              <span style={{ textDecoration: "underline" }}>{yearFilter}</span>
            </Tooltip>
          </p>
          <Form.Item
            label="בחר הגשה"
            name="submissionName"
            hasFeedback
            rules={[
              {
                required: true,
                message: "חובה לבחור הגשה",
              },
            ]}>
            <Select placeholder="בחר הגשה">
              {submissionData
                .filter((project) => project.year === yearFilter)
                .flatMap((submission, projectIndex) =>
                  submission.submissions.map((sub) => ({
                    ...sub,
                    projectIndex, // Add the project index to maintain uniqueness
                  }))
                )
                .filter((sub) => sub.name)
                .filter((sub, index, array) => array.findIndex((item) => item.name === sub.name) === index)
                .map((sub) => (
                  <Option key={`${sub.name}-${sub.projectIndex}`} value={sub.name}>
                    {sub.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
        {progress > 0 && (
          <>
            <span>{progress === 100 ? "הקצאה הושלמה" : "מבצע הקצאה של שופטים..."}</span>
            <Progress percent={progress} status="active" showInfo={false} style={{ marginBottom: "1rem" }} />
          </>
        )}
      </Modal>
      <Modal
        title={`אישור מחיקה`}
        open={deleteAllSubmissionsConfirm !== null}
        okText="מחק"
        cancelText="ביטול"
        okButtonProps={{ danger: true }}
        onOk={() => {
          handleOkDelete(deleteAllSubmissionsConfirm);
        }}
        onCancel={() => setDeleteAllSubmissionsConfirm(null)}>
        {`האם אתה בטוח שברצונך למחוק את כל ההגשות עם שם ${deleteAllSubmissionsConfirm?.submissionName} מהשנה ${yearFilter}?`}
      </Modal>
      <Modal
        title="מחיקת הגשות"
        open={deleteAllSubmissions}
        cancelText="בטל"
        okText="אשר מחיקה"
        okButtonProps={{ danger: true }}
        onCancel={() => {
          setDeleteAllSubmissions(false);
          deleteSubmissionsForm.resetFields();
          setSelectedGroupSubmissions([]);
        }}
        onOk={() => {
          deleteSubmissionsForm
            .validateFields()
            .then((values) => {
              setDeleteAllSubmissionsConfirm(values);
              deleteSubmissionsForm.resetFields();
            })
            .catch((info) => {
              console.log("Validate Failed:", info);
            });
        }}>
        <Form layout="vertical" form={deleteSubmissionsForm}>
          <p>
            <span style={{ color: "red", fontWeight: 600 }}>שים לב</span> - המחיקה מוחקת את כל ההגשות עם שם זה עבור השנה{" "}
            <Tooltip title="ניתן לשנות בחירה ב dropdown">
              <span style={{ textDecoration: "underline" }}>{yearFilter}</span>
            </Tooltip>
          </p>
          <Form.Item
            label="הגשה"
            name="submissionName"
            hasFeedback
            rules={[
              {
                required: true,
                message: "חובה לבחור הגשה",
              },
            ]}>
            <Select placeholder="בחר הגשה">
              {submissionData
                .filter((project) => project.year === yearFilter)
                .flatMap((submission, projectIndex) =>
                  submission.submissions.map((sub) => ({
                    ...sub,
                    projectIndex, // Add the project index to maintain uniqueness
                  }))
                )
                .filter((sub) => sub.name)
                .filter((sub, index, array) => array.findIndex((item) => item.name === sub.name) === index)
                .map((sub) => (
                  <Option key={`${sub.name}-${sub.projectIndex}`} value={sub.name}>
                    {sub.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item label="קבוצות (אם לא תיבחר קבוצה המחיקה תהיה לכולם)" name="groups" hasFeedback>
            <Select
              value={selectedGroupSubmissions}
              onChange={(value) => setSelectedGroupSubmissions(value)}
              mode="multiple"
              placeholder="בחר קבוצות"
              filterOption={filterOption}>
              {groups
                .filter((group) => yearFilter === "all" || group.year === yearFilter)
                .map((group) => (
                  <Select.Option key={group._id} value={group._id}>
                    {group.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="מחיקת הגשה"
        open={deleteSubmission != null}
        cancelText="בטל"
        okText="מחיקה"
        okButtonProps={{ danger: true }}
        onCancel={() => setDeleteSubmission(null)}
        onOk={() => {
          handleDeleteSpecific(deleteSubmission);
        }}>
        <p>
          <span style={{ color: "red", fontWeight: 600 }}>שים לב</span> - הינך מוחק את ההגשה{" "}
          <span style={{ backgroundColor: "#e4eafc", padding: "1px 2px", borderRadius: "5px" }}>
            {deleteSubmission?.submission.name}
          </span>
          <br />
          עבור הפרויקט -
          <span style={{ backgroundColor: "#e4eafc", padding: "1px 2px", borderRadius: "5px" }}>
            {deleteSubmission?.project.title}
          </span>
        </p>
      </Modal>
      <Modal
        title={`עריכת פרטי הגשה עבור ${specificSubmissionInfo?.project.title} - ${specificSubmissionInfo?.submission.name}`}
        open={specificSubmissionInfo !== null}
        cancelText="סגור"
        okText="עדכן"
        onCancel={() => {
          editSpecificSubmission.resetFields();
          setSpecificSubmissionInfo(null);
        }}
        onOk={() => {
          editSpecificSubmission
            .validateFields()
            .then((values) => {
              setSubmissionData((prevData) =>
                prevData.map((project) => {
                  if (project.key === specificSubmissionInfo.project.key) {
                    return {
                      ...project,
                      submissions: project.submissions.map((submission) => {
                        if (submission.submissionid === specificSubmissionInfo.submission.submissionid) {
                          return {
                            ...submission,
                            submissionName: values.submissionName,
                            submissionDate: values.submissionDate,
                            submissionChecklist: values.submissionChecklist,
                          };
                        }
                        return submission;
                      }),
                    };
                  }
                  return project;
                })
              );

              setSubmissionInfo((prevInfo) => {
                if (prevInfo?.submission?.submissionid === specificSubmissionInfo.submission.submissionid) {
                  return {
                    ...prevInfo,
                    submission: {
                      ...prevInfo.submission,
                      name: values.submissionName,
                      submissionDate: values.submissionDate,
                      isGraded: values.submissionChecklist.includes("isGraded"),
                      isReviewed: values.submissionChecklist.includes("isReviewed"),
                      fileNeeded: values.submissionChecklist.includes("fileNeeded"),
                      noJudges: values.submissionChecklist.includes("noJudges"),
                    },
                  };
                }
                return prevInfo;
              });
              handleOkEditSpecific(values);
            })
            .catch((info) => {
              console.log("Validate Failed:", info);
            });
        }}>
        <Form layout="vertical" form={editSpecificSubmission}>
          <Form.Item label="שם הפרויקט" name="projectName">
            <Input disabled />
          </Form.Item>
          <Form.Item
            label="שם ההגשה"
            name="submissionName"
            hasFeedback
            rules={[
              {
                required: true,
                message: "חובה להזין שם ההגשה",
              },
            ]}>
            <Input />
          </Form.Item>
          {windowSize.width < 500 ? (
            <div className="submission-date-time-mobile">
              <Form.Item
                label="תאריך הגשה"
                name="submissionDate"
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "שדה חובה",
                  },
                ]}>
                <DatePicker
                  className="submission-date-time-mobile-item"
                  format="DD-MM-YYYY"
                  placeholder="בחר תאריך"
                  locale={locale}
                />
              </Form.Item>
              <Form.Item
                label="שעת הגשה"
                name="submissionTime"
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "שדה חובה",
                  },
                ]}>
                <TimePicker
                  className="submission-date-time-mobile-item"
                  format="HH:mm"
                  placeholder="בחר שעה"
                  locale={locale}
                />
              </Form.Item>
            </div>
          ) : (
            <Form.Item
              label="תאריך הגשה"
              name="submissionDate"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "חובה להזין תאריך הגשה",
                },
              ]}>
              <DatePicker
                className="date-picker"
                locale={locale} // Add the Hebrew locale here
                direction="rtl"
                showTime={{
                  format: "HH:mm",
                }}
                format="DD-MM-YYYY HH:mm"
              />
            </Form.Item>
          )}
          <Form.Item name="submissionChecklist">
            <Checkbox.Group>
              <Checkbox value="isGraded">מתן ציון</Checkbox>
              <Checkbox value="isReviewed">מתן משוב</Checkbox>
              <Checkbox value="fileNeeded">נדרש קובץ</Checkbox>
              <Checkbox value="noJudges">ללא שופטים</Checkbox>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={`פרטי ההגשה עבור: ${submissionInfo?.project.title} - ${submissionInfo?.submission.name}`}
        open={submissionInfo !== null}
        onCancel={() => setSubmissionInfo(null)}
        footer={
          <div className="footer-submission-actions">
            <Tooltip title="מחיקת הגשה">
              <DeleteOutlined className="delete-icon" onClick={() => setDeleteSubmission(submissionInfo)} />
            </Tooltip>
            <Button
              type="primary"
              key="back"
              onClick={() => {
                setSubmissionInfo(null);
              }}>
              סגור
            </Button>
          </div>
        }
        width={800}>
        {submissionInfo && (
          <div className="submission-info-modal">
            <div className="submission-header">
              <div className="header-title">
                <h2>{submissionInfo.project.title}</h2>
                <Tooltip
                  title={`עריכת פרטי הגשה עבור ${submissionInfo.submission.name} של ${submissionInfo.project.title}`}>
                  <a href="#">
                    <EditOutlined
                      className="edit-icon"
                      onClick={() => {
                        editSpecificSubmission.setFieldsValue({
                          projectName: submissionInfo.project.title,
                          submissionName: submissionInfo.submission.name,
                          submissionDate: dayjs(submissionInfo.submission.submissionDate),
                          submissionChecklist: [
                            submissionInfo.submission.isGraded ? "isGraded" : null,
                            submissionInfo.submission.isReviewed ? "isReviewed" : null,
                            submissionInfo.submission.fileNeeded ? "fileNeeded" : null,
                            submissionInfo.submission.noJudges ? "noJudges" : null,
                          ].filter((value) => value !== null),
                        });
                        setSpecificSubmissionInfo(submissionInfo);
                      }}
                    />
                  </a>
                </Tooltip>
              </div>
            </div>
            <div className="submission-details">
              <div className="detail-item">
                <div className="detail-item-header">שם ההגשה:</div>
                <div className="detail-item-content">{submissionInfo.submission.name}</div>
              </div>
              {submissionInfo.submission.info && (
                <div className="detail-item">
                  <div className="detail-item-header">הנחיות הגשה:</div>
                  <div className="detail-item-content">{submissionInfo.submission.info}</div>
                </div>
              )}
              <div className="detail-item">
                <div className="detail-item-header">סטטוס ההגשה:</div>
                <div className="detail-item-content">
                  <Badge
                    color={
                      submissionInfo.submission.submitted || !submissionInfo.submission.fileNeeded
                        ? submissionInfo.submission.isLate
                          ? "darkgreen"
                          : "green"
                        : "orange"
                    }
                    text={
                      !submissionInfo.submission.fileNeeded
                        ? "לא נדרש קובץ"
                        : submissionInfo.submission.submitted
                        ? `הוגש${
                            submissionInfo.submission.isLate
                              ? ` באיחור - ${Math.ceil(
                                  (new Date(submissionInfo.submission.uploadDate) -
                                    new Date(submissionInfo.submission.submissionDate)) /
                                    (1000 * 60 * 60 * 24)
                                )} ימים`
                              : ""
                          }`
                        : "ממתין להגשה"
                    }
                  />
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-item-header">סטטוס בדיקה:</div>
                <div className="detail-item-content">
                  {submissionInfo.submission.submitted &&
                  submissionInfo.submission.grades.some((grade) => grade.grade === null)
                    ? "ממתין לבדיקה"
                    : submissionInfo.submission.submitted
                    ? "נבדק"
                    : "לא הוגש"}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-item-header">תאריך הגשה אחרון:</div>
                <div className="detail-item-content">
                  {new Date(submissionInfo.submission.submissionDate).toLocaleString("he-IL", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-item-header">הוגש ב:</div>
                <div className="detail-item-content">
                  {submissionInfo.submission.uploadDate
                    ? new Date(submissionInfo.submission?.uploadDate).toLocaleString("he-IL", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "ממתין להגשה"}
                </div>
              </div>
              {submissionInfo.submission.finalGrade != null && (
                <div className="detail-item">
                  <div className="detail-item-header">ציון סופי</div>
                  <div className="detail-item-content">
                    <div className="changeable-content">
                      {submissionInfo.submission?.overridden?.newGrade
                        ? submissionInfo.submission?.overridden?.newGrade
                        : submissionInfo?.submission?.finalGrade}
                      <a
                        onClick={() => {
                          setGradeFormOpen(true);
                          gradeForm.setFieldsValue({
                            oldGrade: submissionInfo?.submission?.finalGrade,
                          });
                        }}>
                        <EditOutlined />
                      </a>
                    </div>
                  </div>
                </div>
              )}
              {submissionInfo.submission.isGraded && submissionInfo.submission.isLate && (
                <div className="detail-item">
                  <div className="detail-item-header">נקודות קנס</div>
                  <div className="detail-item-content">
                    <div className="changeable-content">
                      {Math.ceil(
                        (new Date(submissionInfo.submission.uploadDate) -
                          new Date(submissionInfo.submission.submissionDate)) /
                          (1000 * 60 * 60 * 24)
                      ) * 2}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="submission-grades">
              <div className="grades-title">
                <h3>ציונים ומשובים</h3>
                {(submissionInfo.submission.isGraded || submissionInfo.submission.isReviewed) && (
                  <Tooltip title="שינוי שופטים">
                    {" "}
                    <UserSwitchOutlined
                      onClick={() => {
                        setUpdateJudgesModal(true);
                        setSubmissionJudges(submissionInfo?.submission?.grades.map((grade) => grade.judge));
                        setJudgeUpdateSubmission(submissionInfo);
                      }}
                    />
                  </Tooltip>
                )}
              </div>
              <Table
                columns={gradeColumns}
                dataSource={submissionInfo?.submission?.grades.map((grade, index) => ({
                  ...grade,
                  key: grade._id || index,
                  isReviewed: submissionInfo?.submission?.isReviewed,
                  isGraded: submissionInfo?.submission?.isGraded,
                }))}
                pagination={false}
              />
            </div>
          </div>
        )}
      </Modal>
      <Modal
        title={`משוב עבור הגשה ${submissionInfo?.submission?.name} של ${submissionInfo?.project?.title}`}
        open={showReview !== null}
        cancelText="סגור"
        onCancel={() => setShowReview(null)}
        okButtonProps={{ style: { display: "none" } }}>
        <div className="details-title">
          <h3>{submissionInfo?.project?.title}</h3>
          <p>הגשה - {submissionInfo?.submission?.name}</p>
          <p>נבדק ע"י: {showReview?.judgeName}</p>
        </div>
        <div className="details-grade">
          {submissionInfo?.submission?.isGraded && (
            <>
              <span>ציון:</span> <p>{showReview?.grade ? showReview?.grade : "לא ניתן ציון"}</p>
            </>
          )}
        </div>
        {submissionInfo?.submission?.isReviewed && (
          <>
            <p>
              <strong>איכות הוידאו:</strong> {renderTextWithNewlines(showReview?.videoQuality)}
            </p>
            <p>
              <strong>איכות העבודה:</strong> {renderTextWithNewlines(showReview?.workQuality)}
            </p>
            <p>
              <strong>איכות הכתיבה:</strong> {renderTextWithNewlines(showReview?.writingQuality)}
            </p>
            <p>
              <strong>מספר הקומיטים:</strong> {showReview?.commits}
            </p>
            {showReview?.journalActive && (
              <p>
                <strong>האם היומן פעיל:</strong>{" "}
                {showReview?.journalActive === "yes" ? "כן" : showReview?.journalActive === "no" ? "לא" : ""}
              </p>
            )}
          </>
        )}
      </Modal>
      <Modal
        title={`שינוי ציון לפרויקט ${submissionInfo?.project?.title} - ${submissionInfo?.submission?.name}`}
        open={gradeFormOpen}
        okText="עדכן ציון"
        cancelText="סגור"
        onOk={() => onOkHandlerGrade()}
        onCancel={() => {
          gradeForm.resetFields();
          setGradeFormOpen(false);
          setGradeToOverride(null);
        }}>
        <Form layout="vertical" form={gradeForm}>
          <p>ניתן להכניס ציון בין 0 ל-100</p>
          <Divider />
          <Form.Item label="ציון קודם" name="oldGrade">
            <Input disabled />
          </Form.Item>
          <Divider />
          <Form.Item
            label="ציון חדש"
            name="newGrade"
            hasFeedback
            rules={[
              {
                required: true,
                message: "חובה להזין ציון בין (0) ל (100)",
              },
            ]}>
            <InputNumber className="input-field-override-grade" min={0} max={100} />
          </Form.Item>
          <Form.Item name="comment">
            <Input.TextArea placeholder="הכנס סיבה לעדכון הציון" rows={4} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="עריכת פרטי הגשה"
        open={editSubmissions}
        okText="עדכן"
        cancelText="סגור"
        onOk={() => onOkHandlerEdit()}
        onCancel={() => {
          setEditSubmissions(false);
          editSubmission.resetFields();
          setSelectedGroupSubmissions([]);
        }}>
        <Form layout="vertical" form={editSubmission}>
          <p>
            <span style={{ color: "red", fontWeight: 600 }}>שים לב</span> - העריכה משנה את כל ההגשות הזמינות עם שם זה
          </p>
          <Form.Item
            label="בחירת הגשה"
            name="submissionOldName"
            hasFeedback
            rules={[
              {
                required: true,
                message: "חובה לבחור הגשת מקור",
              },
            ]}>
            <Select
              placeholder="בחר הגשה"
              onChange={(value) => {
                // Find the selected submission details
                const selectedSubmission = submissionDetails.find((submission) => submission.name === value);

                // Set form fields with the selected submission details
                editSubmission.setFieldsValue({
                  SubmissionName: value,
                  submissionInfo: selectedSubmission?.info || "", // Populate `submissionInfo` if available
                });
              }}>
              {submissionData
                .filter((project) => project.year === yearFilter)
                .flatMap((submission) => submission.submissions) // Flatten the submissions array
                .filter((sub) => sub.name) // Filter out entries without names
                .filter(
                  (sub, index, array) => array.findIndex((item) => item.name === sub.name) === index // Keep only first occurrence
                )
                .map((sub, index) => (
                  <Option key={index} value={sub.name}>
                    {sub.name}
                  </Option>
                ))}
              {/* {submissionDetails.map((submission, index) => (
                <Option key={index} value={submission.name}>
                  {submission.name}
                </Option>
              ))} */}
            </Select>
          </Form.Item>
          <Form.Item label="קבוצות (אם לא תיבחר קבוצה השינוי יהיה לכולם)" name="group" hasFeedback>
            <Select
              value={selectedGroupSubmissions}
              onChange={(value) => setSelectedGroupSubmissions(value)}
              mode="multiple"
              placeholder="בחר קבוצות"
              filterOption={filterOption}>
              {groups
                .filter((group) => yearFilter === "all" || group.year === yearFilter)
                .map((group) => (
                  <Select.Option key={group._id} value={group._id}>
                    {group.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="שם הגשה חדש"
            name="SubmissionName"
            hasFeedback
            rules={[{ required: true, message: "חובה להזין שם הגשה" }]}>
            <Input />
          </Form.Item>
          {windowSize.width < 500 ? (
            <div className="submission-date-time-mobile">
              <Form.Item
                label="תאריך הגשה"
                name="submissionDate"
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "שדה חובה",
                  },
                ]}>
                <DatePicker
                  className="submission-date-time-mobile-item"
                  format="DD-MM-YYYY"
                  placeholder="בחר תאריך"
                  locale={locale}
                />
              </Form.Item>
              <Form.Item
                label="שעת הגשה"
                name="submissionTime"
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "שדה חובה",
                  },
                ]}>
                <TimePicker
                  className="submission-date-time-mobile-item"
                  format="HH:mm"
                  placeholder="בחר שעה"
                  locale={locale}
                />
              </Form.Item>
            </div>
          ) : (
            <Form.Item
              label="תאריך הגשה"
              name="submissionDate"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "חובה להזין תאריך הגשה",
                },
                {
                  validator: (_, value) => {
                    if (!value) {
                      return Promise.resolve(); // Skip validation if no value is selected (handled by `required`)
                    }
                    // Check if the selected date is in the past
                    const now = dayjs(); // Or dayjs(), if you're using dayjs
                    if (value.isBefore(now)) {
                      return Promise.reject(new Error("לא ניתן לבחור תאריך ושעה שעברו"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}>
              <DatePicker
                className="date-picker"
                locale={locale} // Add the Hebrew locale here
                direction="rtl"
                showTime={{
                  format: "HH:mm",
                }}
                format="DD-MM-YYYY HH:mm"
              />
            </Form.Item>
          )}
          <Form.Item label="פרטים נוספים" name="submissionInfo">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="פתיחת הגשה חדשה לכולם"
        open={allSubmissions}
        okText="יצירת הגשה"
        cancelText="סגור"
        onCancel={() => {
          formAll.resetFields();
          setAllSubmissions(false);
          setSubmissionType(null);
          setSelectedGroupSubmissions([]);
        }}
        onOk={onOkHandlerAll}>
        <Form
          layout="vertical"
          form={formAll} // Ensure this line is present
        >
          <Form.Item label="סוג הגשה" name="submissionType" initialValue={"proposalReport"} hasFeedback>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={submissionOptions}
              onChange={(e) => {
                setSubmissionType(e.target.value);
              }}
            />
          </Form.Item>
          {submissionType === "other" && (
            <Form.Item
              label="שם ההגשה"
              name="submissionName"
              hasFeedback
              rules={[
                {
                  required: submissionType === "other",
                  message: "חובה להזין שם ההגשה",
                },
              ]}>
              <Input />
            </Form.Item>
          )}
          {windowSize.width < 500 ? (
            <div className="submission-date-time-mobile">
              <Form.Item
                label="תאריך הגשה"
                name="submissionDate"
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "שדה חובה",
                  },
                ]}>
                <DatePicker
                  className="submission-date-time-mobile-item"
                  format="DD-MM-YYYY"
                  placeholder="בחר תאריך"
                  locale={locale}
                />
              </Form.Item>
              <Form.Item
                label="שעת הגשה"
                name="submissionTime"
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "שדה חובה",
                  },
                ]}>
                <TimePicker
                  className="submission-date-time-mobile-item"
                  format="HH:mm"
                  placeholder="בחר שעה"
                  locale={locale}
                />
              </Form.Item>
            </div>
          ) : (
            <Form.Item
              label="תאריך הגשה"
              name="submissionDate"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "חובה להזין תאריך הגשה",
                },
              ]}>
              <DatePicker
                className="date-picker"
                // Add the Hebrew locale here
                direction="rtl"
                showTime={{
                  format: "HH:mm",
                }}
                format="DD-MM-YYYY HH:mm"
                placeholder="בחר תאריך ושעה"
              />
            </Form.Item>
          )}
          <Form.Item label="קבוצות (אם לא נבחר אז יפתח לכולם)" name="groups" hasFeedback>
            <Select
              value={selectedGroupSubmissions}
              onChange={(value) => setSelectedGroupSubmissions(value)}
              mode="multiple"
              placeholder="בחר קבוצות"
              filterOption={filterOption}>
              {groups
                .filter((group) => yearFilter === "all" || group.year === yearFilter)
                .map((group) => (
                  <Select.Option key={group._id} value={group._id}>
                    {group.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item label="פרטים נוספים" name="submissionInfo">
            <TextArea rows={4} />
          </Form.Item>

          {submissionType === "other" && (
            <Form.Item name="submissionChecklist">
              <Checkbox.Group>
                <Checkbox value="isGraded">מתן ציון</Checkbox>
                <Checkbox value="isReviewed">מתן משוב</Checkbox>
                <Checkbox value="fileNeeded">נדרש קובץ</Checkbox>
                <Checkbox value="noJudges">ללא שופטים</Checkbox>
              </Checkbox.Group>
            </Form.Item>
          )}
        </Form>
      </Modal>
      <Modal
        title="פתיחת הגשה ספציפית"
        open={specificSubmission}
        okText="יצירת הגשה"
        cancelText="סגור"
        onOk={() => onOkHandlerSpecific()}
        onCancel={() => {
          formSpecific.resetFields();
          setSpecificSubmission(false);
          setSubmissionType(null);
        }}>
        <Form layout="vertical" form={formSpecific}>
          {/* סוג הגשה */}
          <Form.Item label="סוג הגשה" name="submissionType" initialValue={"proposalReport"} hasFeedback>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={submissionOptions}
              onChange={(e) => {
                const selectedName = submissionOptions.find((option) => option.value === e.target.value).value;
                setSubmissionType(selectedName);
                const selectedSubmission = submissionDetails.find((submission) => submission.name === selectedName);

                // If a submission is found, update additional state or handle accordingly
                if (selectedSubmission) {
                  formSpecific.setFieldsValue({
                    submissionInfo: selectedSubmission.info,
                  });
                }
              }}
            />
          </Form.Item>

          {/* שם ההגשה */}
          {submissionType === "other" && (
            <Form.Item
              label="שם ההגשה"
              name="submissionName"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "חובה להזין שם ההגשה",
                },
              ]}>
              <Input />
            </Form.Item>
          )}

          {/* תאריך הגשה */}
          {windowSize.width < 500 ? (
            <div className="submission-date-time-mobile">
              <Form.Item
                label="תאריך הגשה"
                name="submissionDate"
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "שדה חובה",
                  },
                ]}>
                <DatePicker
                  className="submission-date-time-mobile-item"
                  format="DD-MM-YYYY"
                  placeholder="בחר תאריך"
                  locale={locale}
                />
              </Form.Item>
              <Form.Item
                label="שעת הגשה"
                name="submissionTime"
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "שדה חובה",
                  },
                ]}>
                <TimePicker
                  className="submission-date-time-mobile-item"
                  format="HH:mm"
                  placeholder="בחר שעה"
                  locale={locale}
                />
              </Form.Item>
            </div>
          ) : (
            <Form.Item
              label="תאריך הגשה"
              name="submissionDate"
              hasFeedback
              rules={[
                {
                  type: "object", // Corrected the type from "array" to "object"
                  required: true,
                  message: "חובה להזין תאריך הגשה",
                },
              ]}>
              <DatePicker
                className="date-picker"
                locale={locale}
                direction="rtl"
                showTime={{ format: "HH:mm" }}
                format="DD-MM-YYYY HH:mm"
              />
            </Form.Item>
          )}

          <Form.Item label="פרטים נוספים" name="submissionInfo">
            <TextArea rows={4} />
          </Form.Item>

          {/* פרויקטים */}
          <Form.Item
            label="פרויקטים"
            name="projects"
            hasFeedback
            rules={[
              {
                required: true,
                message: "חובה לבחור פרויקטים",
              },
            ]}>
            <Select mode="multiple" placeholder="בחר פרויקטים" filterOption={filterOption}>
              {projects
                .filter(
                  (project) =>
                    (yearFilter === "all" || project.year === yearFilter) &&
                    project.students.length !== 0 &&
                    project.advisors.length !== 0
                )
                .map((project) => (
                  <Select.Option key={project._id} value={project._id}>
                    {project.title}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          {submissionType === "other" && (
            <Form.Item name="submissionChecklist">
              <Checkbox.Group>
                <Checkbox value="isGraded">מתן ציון</Checkbox>
                <Checkbox value="isReviewed">מתן משוב</Checkbox>
                <Checkbox value="fileNeeded">נדרש קובץ</Checkbox>
                <Checkbox value="noJudges">ללא שופטים</Checkbox>
              </Checkbox.Group>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title="רשימת קבצים"
        open={fileListModal}
        onCancel={() => {
          setFileListModal(false);
          setSubmissionInfoModalData({});
        }}
        cancelText="סגור"
        okButtonProps={{ style: { display: "none" } }}>
        <ul>
          {submissionInfoModalData.file && (
            <li>
              <a onClick={() => downloadFile(submissionInfoModalData.file._id, "submissions")}>
                {submissionInfoModalData.file.filename}
              </a>
            </li>
          )}
          {submissionInfoModalData.extraUploadFile && (
            <li>
              <a onClick={() => downloadFile(submissionInfoModalData.extraUploadFile._id, "submissions")}>
                {submissionInfoModalData.extraUploadFile.filename}
              </a>
            </li>
          )}
        </ul>
      </Modal>
    </div>
  );
};

export default Submissions;
