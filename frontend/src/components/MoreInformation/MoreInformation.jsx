import React, { useState, useEffect, useRef, useContext } from "react";
import "./MoreInformation.scss";
import axios from "axios";
import {
  Form,
  Input,
  InputNumber,
  Table,
  Typography,
  message,
  Tooltip,
  Tabs,
  Button,
  Popconfirm,
  DatePicker,
  Select,
  Upload,
  Modal,
  Divider,
  Pagination,
} from "antd";
import locale from "antd/es/date-picker/locale/he_IL";
import { EditOutlined, SaveOutlined, StopOutlined, DeleteOutlined, InboxOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { getColumnSearchProps as getColumnSearchPropsUtil } from "../../utils/tableUtils";
import { handleEditSave } from "../../utils/editUtils";
import dayjs from "dayjs";
import { Editor } from "primereact/editor";
import { processContent } from "../../utils/htmlProcessor";
import FileCard from "../FileCard/FileCard";
import * as XLSX from "xlsx";
import { NotificationsContext } from "../../utils/NotificationsContext";

const MoreInformation = () => {
  const { fetchNotifications } = useContext(NotificationsContext);
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : {};
  });
  const [form] = Form.useForm();
  const [examTableForm] = Form.useForm();
  const [formEditClasses] = Form.useForm();
  const [formGrades] = Form.useForm();
  const [formEditGrades] = Form.useForm();
  const [formAddData] = Form.useForm();
  const [editDatesForm] = Form.useForm();
  const [data, setData] = useState([]);
  const [editingKey, setEditingKey] = useState("");
  const [editingGradesKey, setEditingGradesKey] = useState("");
  const [loading, setLoading] = useState(false);
  const isEditing = (record) => record.key === editingKey;
  const isGradesEditing = (record) => record.key === editingGradesKey;
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const [gradesData, setGradesData] = useState([]);
  const [gradeWeightDescription, setGradeWeightDescription] = useState("");
  const [randomText, setRandomText] = useState("");
  const [randomTextId, setRandomTextId] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [moreInformationFiles, setMoreInformationFiles] = useState([]);
  const [isEditingFile, setIsEditingFile] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [currentFile, setCurrentFile] = useState({});
  const [groups, setGroups] = useState([]);
  const [thisYearGroups, setThisYearGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [allGradeStructures, setAllGradeStructures] = useState([]);
  const [deleteGradeStructureModal, setDeleteGradeStructureModal] = useState(false);
  const [selectedGradeStructure, setSelectedGradeStructure] = useState("");
  const [configYear, setConfigYear] = useState("");
  const [tableData, setTableData] = useState([]);
  const [allTables, setAllTables] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [classNames, setClassNames] = useState({
    class1: "כיתה 1",
    class2: "כיתה 2",
    class3: "כיתה 3",
    class4: "כיתה 4",
  });
  const [editClassesModal, setEditClassesModal] = useState(false);
  const [deleteTableModal, setDeleteTableModal] = useState(false);
  const [editExamTableClicked, setEditExamTableClicked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddDataModalVisible, setIsAddDataModalVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isDeleteDataModalVisible, setIsDeleteDataModalVisible] = useState(false);
  const [allTablesUpdated, setAllTablesUpdated] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTableProjects, setSelectedTableProjects] = useState([]);
  const [selectedGroupToAddProject, setSelectedGroupToAddProject] = useState("");
  const [selectedGroupProjects, setSelectedGroupProjects] = useState([]);
  const [examDates, setExamDates] = useState([]);
  const [editDatesModal, setEditDatesModal] = useState(false);
  const { Dragger } = Upload;
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

  const FileExcelOutlinedIcon = () => (
    <svg className="excel-icon" viewBox="0 0 32 32" fill="#000000" onClick={exportToExcel}>
      <defs>
        <linearGradient
          id="excel-gradient"
          x1="4.494"
          y1="-2092.086"
          x2="13.832"
          y2="-2075.914"
          gradientTransform="translate(0 2100)"
          gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#18884f" />
          <stop offset="0.5" stopColor="#117e43" />
          <stop offset="1" stopColor="#0b6631" />
        </linearGradient>
      </defs>
      <path
        d="M19.581,15.35,8.512,13.4V27.809A1.192,1.192,0,0,0,9.705,29h19.1A1.192,1.192,0,0,0,30,27.809h0V22.5Z"
        fill="#185c37"
      />
      <path d="M19.581,3H9.705A1.192,1.192,0,0,0,8.512,4.191h0V9.5L19.581,16l5.861,1.95L30,16V9.5Z" fill="#21a366" />
      <path d="M8.512,9.5H19.581V16H8.512Z" fill="#107c41" />
      <path d="M16.434,8.2H8.512V24.45h7.922a1.2,1.2,0,0,0,1.194-1.191V9.391A1.2,1.2,0,0,0,16.434,8.2Z" opacity="0.1" />
      <path
        d="M15.783,8.85H8.512V25.1h7.271a1.2,1.2,0,0,0,1.194-1.191V10.041A1.2,1.2,0,0,0,15.783,8.85Z"
        opacity="0.2"
      />
      <path
        d="M15.783,8.85H8.512V23.8h7.271a1.2,1.2,0,0,0,1.194-1.191V10.041A1.2,1.2,0,0,0,15.783,8.85Z"
        opacity="0.2"
      />
      <path
        d="M15.132,8.85H8.512V23.8h6.62a1.2,1.2,0,0,0,1.194-1.191V10.041A1.2,1.2,0,0,0,15.132,8.85Z"
        opacity="0.2"
      />
      <path
        d="M3.194,8.85H15.132a1.193,1.193,0,0,1,1.194,1.191V21.959a1.193,1.193,0,0,1-1.194,1.191H3.194A1.192,1.192,0,0,1,2,21.959V10.041A1.192,1.192,0,0,1,3.194,8.85Z"
        fill="url(#excel-gradient)"
      />
      <path
        d="M5.7,19.873l2.511-3.884-2.3-3.862H7.758L9.013,14.6c.116.234.2.408.238.524h.017c.082-.188.169-.369.26-.546l1.342-2.447h1.7l-2.359,3.84,2.419,3.905H10.821l-1.45-2.711A2.355,2.355,0,0,1,9.2,16.8H9.176a1.688,1.688,0,0,1-.168.351L7.515,19.873Z"
        fill="#fff"
      />
      <path d="M28.806,3H19.581V9.5H30V4.191A1.192,1.192,0,0,0,28.806,3Z" fill="#33c481" />
      <path d="M19.581,16H30v6.5H19.581Z" fill="#107c41" />
    </svg>
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [advisorsRes, randomTextRes, filesRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/advisors-for-users-info`, {
            withCredentials: true,
          }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/random/description-for-grade-structure`, {
            withCredentials: true,
          }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/uploads?destination=moreInformation`, {
            withCredentials: true,
          }),
        ]);

        const advisors = advisorsRes.data.map((advisor) => ({
          ...advisor,
          key: advisor._id,
        }));
        setData(advisors);

        if (randomTextRes.data.length > 0) {
          setRandomText(randomTextRes.data[0].descriptionForGradeStructure);
          setRandomTextId(randomTextRes.data[0]._id);
        }

        setMoreInformationFiles(filesRes.data);

        setLoading(false);
      } catch (error) {
        console.error("Error occurred:", error);
        setLoading(false);
      }
    };
    fetchData();
    fetchNotifications();
  }, []);

  const getExamTables = async (callback) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/project/get-exam-tables`, {
        withCredentials: true,
      });
      setAllTables(res.data);
      if (callback) callback();
    } catch (error) {
      console.error("Error fetching exam tables:", error);
    }
  };

  useEffect(() => {
    const fetchGroupsAndExamTable = async () => {
      try {
        setLoading(true);
        const [groupRes, configRes, examTableRes, yearsRes, projectsRes, currentYearGroupsRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/group/get`, {
            withCredentials: true,
          }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/config/get-config`, {
            withCredentials: true,
          }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/project/get-exam-tables`, {
            withCredentials: true,
          }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/project/years`, {
            withCredentials: true,
          }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/project/get-projects-for-exam-table`, {
            withCredentials: true,
          }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/group/get-current-year`, { withCredentials: true }),
        ]);
        setGroups(groupRes.data);
        setConfigYear(configRes.data.currentYear);
        setAllTables(examTableRes.data);
        setSelectedYear(configRes.data.currentYear);
        const sortedYears = yearsRes.data.sort((a, b) => b.localeCompare(a));
        setYears(sortedYears);
        setProjects(projectsRes.data);
        setThisYearGroups(currentYearGroupsRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching groups and exam table:", error);
        setLoading(false);
      }
    };
    fetchGroupsAndExamTable();
  }, []);

  const fetchGradeStructure = async () => {
    try {
      const allGradeStructuresRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/grade-structure/`, {
        withCredentials: true,
      });
      setAllGradeStructures(allGradeStructuresRes.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  useEffect(() => {
    fetchGradeStructure();
  }, []);

  useEffect(() => {
    if (allTablesUpdated) {
      handleShowTableData(selectedTable);
      setAllTablesUpdated(false);
    }
  }, [allTablesUpdated]);

  const handleEditorChange = (e) => {
    setGradeWeightDescription(e.htmlValue || "");
  };

  const saveRandomText = async () => {
    try {
      if (randomTextId) {
        await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/random/edit-description-for-grade-structure/${randomTextId}`,
          {
            descriptionForGradeStructure: gradeWeightDescription,
          },
          {
            withCredentials: true,
          }
        );
      } else {
        const res = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/random/create-description-for-grade-structure`,
          {
            descriptionForGradeStructure: gradeWeightDescription,
          },
          {
            withCredentials: true,
          }
        );
        setRandomTextId(res.data._id);
      }
      setRandomText(gradeWeightDescription);
      setGradeWeightDescription("");
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  const editRandomText = () => {
    setGradeWeightDescription(randomText);
  };

  const deleteRandomText = async () => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/random/delete-description-for-grade-structure/${randomTextId}`,
        {
          withCredentials: true,
        }
      );
      setRandomText("");
      setRandomTextId(null);
      setGradeWeightDescription("");
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  const EditableCell = ({ editing, dataIndex, title, inputType, record, index, children, ...restProps }) => {
    const inputNode =
      inputType === "number" ? (
        <InputNumber />
      ) : dataIndex === "date" ? (
        <DatePicker locale={locale} />
      ) : dataIndex === "weight" ? (
        <InputNumber min={0} max={100} />
      ) : (
        <Input />
      );
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{
              margin: 0,
            }}
            rules={[
              {
                required: true,
                message: "שדה חובה",
              },
            ]}>
            {inputNode}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  const edit = (record) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  const editGrades = (record) => {
    formEditGrades.setFieldsValue({ ...record, date: dayjs(record.date) });
    setEditingGradesKey(record.key);
  };

  const cancel = () => {
    setEditingKey("");
    form.resetFields();
  };

  const cancelGrades = () => {
    setEditingGradesKey("");
    formEditGrades.resetFields();
  };

  const save = async (key, isGrade) => {
    if (isGrade) {
      try {
        const row = await formEditGrades.validateFields();
        const newData = [...allGradeStructures];
        const gradeIndex = newData.findIndex((grade) => grade.items.some((item) => item._id === key));
        if (gradeIndex > -1) {
          const itemIndex = newData[gradeIndex].items.findIndex((item) => item._id === key);
          if (itemIndex > -1) {
            const item = newData[gradeIndex].items[itemIndex];
            const updatedItem = { ...item, ...row };
            newData[gradeIndex].items.splice(itemIndex, 1, updatedItem);
            await axios.put(
              `${process.env.REACT_APP_BACKEND_URL}/api/grade-structure/${newData[gradeIndex]._id}`,
              updatedItem,
              {
                withCredentials: true,
              }
            );
            fetchGradeStructure();
            formEditGrades.resetFields();
            setEditingGradesKey("");
          }
        }
      } catch (errInfo) {
        console.log("Validate Failed:", errInfo);
      }
    } else {
      await handleEditSave(key, form, data, setData, "/api/user/edit-user-coordinator", {
        interests: form.getFieldValue("interests"),
      });
      setEditingKey("");
    }
  };

  const handleEmailClick = (email) => {
    navigator.clipboard.writeText(email);
    message.success("הועתק");
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
      title: "שם המנחה",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
      width: windowSize.width > 768 ? "22.5%" : 250,
      render: (text) => (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text}
        />
      ),
    },
    {
      title: "מייל",
      dataIndex: "email",
      key: "email",
      width: windowSize.width > 768 ? "22.5%" : 250,
      render: (text) => (
        <Tooltip title="לחץ להעתקה">
          <a onClick={() => handleEmailClick(text)}>{text}</a>
        </Tooltip>
      ),
    },
    {
      title: "תחומי עניין אקדמיים",
      dataIndex: "interests",
      key: "interests",
      width: windowSize.width > 768 ? "22.5%" : 300,
      editable: true,
      render: (interests) => <p>{interests ? interests : "אין תחום עניין"}</p>,
      filters: [
        { text: "קיים תחום עניין", value: "קיים תחום עניין" },
        { text: "אין תחום עניין", value: "אין תחום עניין" },
      ],
      onFilter: (value, record) => {
        if (value === "קיים תחום עניין") {
          return record.interests;
        } else {
          return !record.interests;
        }
      },
    },
    {
      title: "האם נשארו פריקטים פנויים",
      dataIndex: "projectsAvailable",
      key: "projectsAvailable",
      width: windowSize.width > 768 ? "22.5%" : 230,
      render: (projectsAvailable) => <p>{projectsAvailable ? "כן" : "לא"}</p>,
      filters: [
        { text: "כן", value: true },
        { text: "לא", value: false },
      ],
      onFilter: (value, record) => record.projectsAvailable === value,
    },
    currentUser.isCoordinator && {
      title: "פעולות",
      dataIndex: "actions",
      key: "actions",
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link
              onClick={() => save(record.key, false)}
              style={{
                marginInlineEnd: 8,
              }}>
              <Tooltip title="שמירה">
                <SaveOutlined className="edit-icon" />
              </Tooltip>
            </Typography.Link>
            <a onClick={cancel}>
              <Tooltip title="ביטול">
                <StopOutlined className="edit-icon" />
              </Tooltip>
            </a>
          </span>
        ) : (
          <Typography.Link disabled={editingKey !== ""} onClick={() => edit(record)}>
            <Tooltip title="עריכה">
              <EditOutlined className="edit-icon" />
            </Tooltip>
          </Typography.Link>
        );
      },
      width: "10%",
    },
  ].filter(Boolean);

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: "text",
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const handleGradeItemDelete = async (structId, itemId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/grade-structure/item/${structId}/${itemId}`, {
        withCredentials: true,
      });
      fetchGradeStructure();
      message.success("הפריט נמחק בהצלחה");
    } catch (error) {
      console.error("Error occurred:", error);
      message.error("מחיקת הפריט נכשלה");
    }
  };

  const handleGradesAdd = async (values) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/grade-structure`, values, {
        withCredentials: true,
      });
      const newGrade = res.data;
      newGrade.key = newGrade._id;
      fetchGradeStructure();
      formGrades.resetFields();
      message.success("הפריט נוסף בהצלחה");
    } catch (error) {
      console.error("Error occurred:", error);
      message.error("הוספת הפריט נכשלה");
    }
  };

  const handleDeleteGradeStructure = async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/grade-structure/${selectedGradeStructure}`, {
        withCredentials: true,
      });
      fetchGradeStructure();
      message.success("מבנה הציונים נמחק בהצלחה");
      setDeleteGradeStructureModal(false);
      setSelectedGradeStructure("");
      setSelectedGroup("");
    } catch (error) {
      console.error("Error occurred:", error);
      message.error("מחיקת מבנה הציונים נכשלה");
    }
  };

  const handleFilterChange = (value) => {
    setSelectedGroup(value);
    const selectedGrade = allGradeStructures.find(
      (grade) => grade.group === value || (value === "all" && grade.group === null)
    );
    setSelectedGradeStructure(selectedGrade ? selectedGrade._id : "");
  };

  const filteredGradesData = allGradeStructures
    .filter((grade) => {
      if (selectedGroup === "all") {
        return grade.group === null;
      }
      return grade.group === selectedGroup;
    })
    .flatMap((grade) =>
      grade.items.map((item) => ({ ...item, key: item._id, structId: grade._id, group: grade.groupName }))
    );

  const gradesColumns = [
    {
      title: "שם",
      dataIndex: "name",
      editable: true,
      width: windowSize.width > 768 ? "26%" : 200,
    },
    {
      title: "משקל",
      dataIndex: "weight",
      editable: true,
      render: (text) => <span>{text === 0 ? "ללא ציון" : `${text}%`}</span>,
      width: windowSize.width > 768 ? "7%" : 100,
    },
    {
      title: "תיאור",
      dataIndex: "description",
      editable: true,
      width: windowSize.width > 768 ? "47%" : 300,
    },
    {
      title: "תאריך הגשה",
      dataIndex: "date",
      editable: true,
      render: (text) => <span>{dayjs(text).format("DD/MM/YYYY")}</span>,
      width: windowSize.width > 768 ? "10%" : 150,
    },
    currentUser.isCoordinator && {
      title: "פעולות",
      dataIndex: "actions",
      key: "actions",
      render: (_, record) => {
        const editable = isGradesEditing(record);
        return editable ? (
          <span>
            <Typography.Link
              onClick={() => save(record.key, true)}
              style={{
                marginInlineEnd: 8,
              }}>
              <Tooltip title="שמירה">
                <SaveOutlined className="grade-weight-icon" />
              </Tooltip>
            </Typography.Link>
            <a onClick={cancelGrades}>
              <Tooltip title="ביטול">
                <StopOutlined className="grade-weight-icon" />
              </Tooltip>
            </a>
          </span>
        ) : (
          <div className="grade-weight-icon-container">
            <Typography.Link disabled={editingGradesKey !== ""} onClick={() => editGrades(record)}>
              <Tooltip title="עריכה">
                <EditOutlined className="grade-weight-icon" />
              </Tooltip>
            </Typography.Link>
            <Popconfirm
              title="בטוח שברצונך למחוק?"
              okText="כן"
              okButtonProps={{ danger: true }}
              cancelText="לא"
              onConfirm={() => handleGradeItemDelete(record.structId, record.key)}>
              <Typography.Link>
                <Tooltip title="מחיקה">
                  <DeleteOutlined className="grade-weight-icon" />
                </Tooltip>
              </Typography.Link>
            </Popconfirm>
          </div>
        );
      },
      width: "10%",
    },
  ].filter(Boolean);

  const gradesMergedColumns = gradesColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        editable: col.editable.toString(),
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isGradesEditing(record),
      }),
    };
  });

  const handleUpload = async () => {
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append("files", file, encodeURIComponent(file.name));
    });
    formData.append("title", title);
    formData.append("description", description);
    formData.append("destination", "moreInformation"); // Set destination for dynamic pathing
    setUploading(true);

    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/uploads?destination=moreInformation`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Filename-Encoding": "url",
        },
        withCredentials: true,
      });
      message.success("הקובץ הועלה בהצלחה");
      setFileList([]);
      clearForm();

      const updatedFiles = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/uploads?destination=moreInformation`,
        {
          withCredentials: true,
        }
      );
      setMoreInformationFiles(updatedFiles.data);
    } catch (error) {
      console.error("Error occurred:", error);
      if (error.response?.status === 500 || error.response?.status === 409) {
        message.error("קובץ עם שם זה כבר קיים");
      } else {
        message.error("העלאת הקובץ נכשלה");
      }
    } finally {
      setUploading(false);
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
      if (file.name.length > 50) {
        message.error(`שם קובץ יכול להכיל עד 50 תווים (רווח גם נחשב כתו)`);
        return Upload.LIST_IGNORE;
      }
      // Check if file with same name already exists in the list of uploaded files
      const isDuplicate = fileList.some((existingFile) => existingFile.name === file.name);
      if (isDuplicate) {
        message.error(`קובץ "${file.name}" כבר קיים`);
        return Upload.LIST_IGNORE;
      }

      if (fileList.length + fileListNew.length > 10) {
        message.error("ניתן להעלות עד 10 קבצים בו זמנית");
        return Upload.LIST_IGNORE;
      }
      setFileList((prevList) => [...prevList, file]);
      return false;
    },
    fileList,
  };

  const setEditingFile = (fileId) => {
    try {
      const file = moreInformationFiles.find((file) => file._id === fileId);
      setCurrentFile(file);
      setEditTitle(file.title);
      setEditDescription(file.description);
    } catch (error) {
      console.error("Error setting editing file:", error);
    }
    setIsEditingFile(true);
  };

  const handleEdit = async (fileId) => {
    try {
      const oldFile = moreInformationFiles.find((file) => file._id === fileId);
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/uploads/update/${fileId}?destination=moreInformation`,
        {
          title: editTitle,
          description: editDescription,
          oldTitle: oldFile.title,
          oldDescription: oldFile.description,
        },
        { withCredentials: true }
      );
      message.success("קובץ עודכן בהצלחה");

      // Refresh updated files based on dynamic destination
      const updatedFiles = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/uploads?destination=moreInformation`,
        {
          withCredentials: true,
        }
      );
      setMoreInformationFiles(updatedFiles.data);
    } catch (error) {
      console.error("Error updating file:", error);
      message.error("שגיאה בעדכון הקובץ");
    } finally {
      setIsEditingFile(false);
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/uploads/delete/${fileId}?destination=moreInformation`,
        {
          withCredentials: true,
        }
      );
      message.success("קובץ נמחק בהצלחה");
    } catch (error) {
      console.error("Error deleting file:", error);
    } finally {
      setMoreInformationFiles((prevFiles) => prevFiles.filter((file) => file._id !== fileId));
    }
  };

  const clearForm = () => {
    setFileList([]);
    setTitle("");
    setDescription("");
  };

  const handleFileEditorChange = (e) => {
    setDescription(e.htmlValue || "");
  };

  const handleEditFileEditorChange = (e) => {
    setEditDescription(e.htmlValue || "");
  };

  const handleShowTableData = async (value) => {
    setSelectedTable(value);
    const selectedTableData = allTables.find((table) => table._id === value);
    const { transformedData, classNames, totalPages } = transformExamTableData(selectedTableData);
    setTableData(transformedData);

    // Extract project IDs and store them in selectedTableProjects
    const projectIds = transformedData.flatMap((data) => [
      ...data.class1.map((project) => project.id),
      ...data.class2.map((project) => project.id),
      ...data.class3.map((project) => project.id),
      ...data.class4.map((project) => project.id),
    ]);
    setSelectedTableProjects(projectIds);

    setClassNames(classNames);
    setTotalPages(totalPages);
    setCurrentPage(1);

    // Extract and format exam dates
    const dates = selectedTableData.days.map((day) => dayjs(day.date).format("DD/MM/YYYY"));
    setExamDates(dates);
  };

  const transformExamTableData = (data) => {
    if (!data || !data.days) {
      return { transformedData: [], classNames: {}, totalPages: 1 };
    }

    const transformedData = [];
    data.days.forEach((day, dayIndex) => {
      day.exams.forEach((exam, examIndex) => {
        transformedData.push({
          key: `day${dayIndex + 1}-exam${examIndex + 1}`,
          time: exam.time,
          class1: exam.projects.slice(0, 1),
          class2: exam.projects.slice(1, 2),
          class3: exam.projects.slice(2, 3),
          class4: exam.projects.slice(3, 4),
        });
      });
    });

    const classNames = {
      class1: data.classes.class1,
      class2: data.classes.class2,
      class3: data.classes.class3,
      class4: data.classes.class4,
    };

    return { transformedData, classNames, totalPages: data.days.length };
  };

  const handleExamTableSubmit = async (values) => {
    const groupId = values.group === "all" ? "all" : values.group;
    const endpoint = values.creationMethod === "ai" ? "create-exam-table" : "create-exam-table-manuel";
    if (allTables.some((table) => table.groupId === groupId && table.year === configYear)) {
      message.error("כבר קיימת טבלת מבחנים עבור קבוצה זו");
      return;
    }
    if (groupId === "all") {
      if (allTables.some((table) => table.groupId === undefined && table.year === configYear)) {
        message.error("כבר קיימת טבלת מבחנים עבור כל הקבוצות");
        return;
      }
    }
    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/project/${endpoint}`,
        {
          groupId,
          class1: values.class1 ? values.class1 : "",
          class2: values.class2 ? values.class2 : "",
          class3: values.class3 ? values.class3 : "",
          class4: values.class4 ? values.class4 : "",
          date: values.date,
        },
        {
          withCredentials: true,
        }
      );
      setSelectedTable(res.data._id);
      await getExamTables(() => setAllTablesUpdated(true));
      setEditExamTableClicked(false);
      message.success("טבלת מבחנים נוצרה בהצלחה");
      setLoading(false);
      examTableForm.resetFields();
    } catch (error) {
      if (error.response?.status === 304) {
        message.error("אין פרויקטים עם מבחן סוף");
        setLoading(false);
      } else if (error.response?.status === 404) {
        message.error("לא נמצאו פרויקטים במערכת");
        setLoading(false);
      } else {
        console.error("Error creating exam table:", error);
        message.error("שגיאה ביצירת טבלת מבחנים");
        setLoading(false);
      }
    }
  };

  const handleEditClasses = async () => {
    try {
      const values = await formEditClasses.validateFields();
      if (
        values.class1 === values.class2 ||
        values.class1 === values.class3 ||
        values.class1 === values.class4 ||
        values.class2 === values.class3 ||
        values.class2 === values.class4 ||
        values.class3 === values.class4
      ) {
        message.error("כיתות חייבות להיות שונות");
        return;
      }
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/project/edit-exam-table-classes/${selectedTable}`,
        {
          class1: values.class1,
          class2: values.class2,
          class3: values.class3,
          class4: values.class4,
        },
        {
          withCredentials: true,
        }
      );
      message.success("כיתות עודכנו בהצלחה");
      getExamTables();
      setClassNames(values);
      setEditClassesModal(false);
    } catch (error) {
      console.error("Error editing exam table classes:", error);
      message.error("שגיאה בעדכון כיתות");
    }
  };

  const handleDeleteTable = async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/project/delete-exam-table/${selectedTable}`, {
        withCredentials: true,
      });
      message.success("טבלת המבחנים נמחקה בהצלחה");
      setDeleteTableModal(false);
      setTableData([]);
      setClassNames({
        class1: "כיתה 1",
        class2: "כיתה 2",
        class3: "כיתה 3",
        class4: "כיתה 4",
      });
      getExamTables();
      setSelectedTable("");
      setEditExamTableClicked(false);
      setExamDates([]);
      setCurrentPage(1);
      setTotalPages(1);
      setSelectedTableProjects([]);
      setSelectedGroup("all");
      setSelectedGroupToAddProject("");
      setSelectedGroupProjects([]);
    } catch (error) {
      console.error("Error deleting exam table:", error);
      message.error("שגיאה במחיקת טבלת מבחנים");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * 9;
    return tableData.slice(startIndex, startIndex + 9);
  };

  const handleCellClick = (record, column) => {
    const cellData = record[column];
    setSelectedCell({ record, column });
    if (cellData && cellData.length > 0) {
      setIsDeleteDataModalVisible(true);
    } else {
      setIsAddDataModalVisible(true);
    }
  };

  const handleDeleteCell = async () => {
    const { record, column } = selectedCell;
    const dayIndex = parseInt(record.key.split("-")[0].replace("day", "")) - 1;
    const examIndex = parseInt(record.key.split("-")[1].replace("exam", "")) - 1;
    const projectIndex = column === "class1" ? 0 : column === "class2" ? 1 : column === "class3" ? 2 : 3;

    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/project/delete-exam-table-cell/${selectedTable}`, {
        data: { dayIndex, examIndex, projectIndex },
        withCredentials: true,
      });
      message.success("פרויקט נמחק מהשיבוץ בהצלחה");
      setIsDeleteDataModalVisible(false);
      await getExamTables(() => setAllTablesUpdated(true));
    } catch (error) {
      console.error("Error deleting cell data:", error);
      message.error("נכשל במחיקת פרויקט מהשיבוץ");
    }
  };

  const getSelectedGroupProjects = async (value) => {
    setSelectedGroupToAddProject(value);
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/group/get-projects/${value}`, {
        withCredentials: true,
      });
      setSelectedGroupProjects(res.data);
    } catch (error) {
      console.error("Error fetching group projects:", error);
    }
  };

  const handleAddData = async () => {
    try {
      await formAddData.validateFields();
    } catch (error) {
      console.error("Validation failed:", error);
      return;
    }

    const { record, column } = selectedCell;
    const dayIndex = parseInt(record.key.split("-")[0].replace("day", "")) - 1;
    const examIndex = parseInt(record.key.split("-")[1].replace("exam", "")) - 1;
    const projectIndex = column === "class1" ? 0 : column === "class2" ? 1 : column === "class3" ? 2 : 3;

    try {
      const project = projects.find((project) => project._id === selectedProject);
      const judges = await fetchJudges(project._id);
      const projectData = {
        id: project._id,
        title: project.title,
        students: project.studentsDetails.map((student) => ({ id: student._id, name: student.name })),
        judges,
      };

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/project/add-exam-table-cell/${selectedTable}`,
        {
          dayIndex,
          examIndex,
          projectIndex,
          project: projectData,
        },
        { withCredentials: true }
      );

      message.success("פרויקט נוסף לשיבוץ בהצלחה");
      setIsAddDataModalVisible(false);
      await getExamTables(() => setAllTablesUpdated(true));
      formAddData.resetFields();
    } catch (error) {
      console.error("Error adding project to exam table cell:", error);
      message.error("נכשל בהוספת פרויקט לשיבוץ");
    }
  };

  const fetchJudges = async (projectId) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/project/get-judges/${projectId}`, {
        withCredentials: true,
      });
      return res.data.map((judge) => ({ id: judge._id, name: judge.name }));
    } catch (error) {
      console.error("Error fetching judges:", error);
      return [];
    }
  };

  const handleProjectChange = async (value) => {
    setSelectedProject(value);
    const selectedProjectData = projects.find((project) => project._id === value);
    const judges = await fetchJudges(value);
    formAddData.setFieldsValue({
      students: selectedProjectData
        ? selectedProjectData.studentsDetails.map((student) => student.name).join(", ")
        : "",
      judges: judges.map((judge) => judge.name).join(", "),
    });
  };

  const handleEditDatesButtonClick = () => {
    const selectedTableData = allTables.find((table) => table._id === selectedTable);
    editDatesForm.setFieldsValue({
      dates: selectedTableData.days.map((day) => dayjs(day.date)),
    });
    setEditDatesModal(true);
  };

  const handleEditDates = async () => {
    try {
      const values = await editDatesForm.validateFields();
      const updatedDates = values.dates.map((date) => date.toISOString());
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/project/edit-exam-table-dates/${selectedTable}`,
        { dates: updatedDates },
        { withCredentials: true }
      );
      message.success("תאריכים עודכנו בהצלחה");
      setEditDatesModal(false);
      await getExamTables(() => setAllTablesUpdated(true));
    } catch (error) {
      console.error("Error editing exam table dates:", error);
      message.error("שגיאה בעדכון תאריכים");
    }
  };

  const exportToExcel = () => {
    const exportData = [];

    tableData.forEach((row, index) => {
      if (index % 9 === 0) {
        const dayIndex = Math.floor(index / 9);
        exportData.push({ תאריך: `תאריך: ${examDates[dayIndex]}` });
      }

      exportData.push({
        שעה: row.time,
        [classNames.class1]: row.class1
          .map(
            (project) =>
              `${project.title} - **סטודנטים:** ${project.students
                .map((student) => student.name)
                .join(", ")} - **שופטים:** ${project.judges.map((judge) => judge.name).join(", ")}`
          )
          .join("\n\n"),
        [classNames.class2]: row.class2
          .map(
            (project) =>
              `${project.title} - **סטודנטים:** ${project.students
                .map((student) => student.name)
                .join(", ")} - **שופטים:** ${project.judges.map((judge) => judge.name).join(", ")}`
          )
          .join("\n\n"),
        [classNames.class3]: row.class3
          .map(
            (project) =>
              `${project.title} - **סטודנטים:** ${project.students
                .map((student) => student.name)
                .join(", ")} - **שופטים:** ${project.judges.map((judge) => judge.name).join(", ")}`
          )
          .join("\n\n"),
        [classNames.class4]: row.class4
          .map(
            (project) =>
              `${project.title} - **סטודנטים:** ${project.students
                .map((student) => student.name)
                .join(", ")} - **שופטים:** ${project.judges.map((judge) => judge.name).join(", ")}`
          )
          .join("\n\n"),
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Exam Table");
    XLSX.writeFile(workbook, "exam-table.xlsx");
  };

  const examTableColumns = [
    {
      title: "שעה",
      dataIndex: "time",
      key: "time",
      fixed: "left",
      render: (text) => <strong>{text}</strong>,
      width: 50,
    },
    {
      title: classNames.class1,
      dataIndex: "class1",
      key: "class1",
      render: (projects, record) => (
        <div
          className={editExamTableClicked ? "ant-table-cell clickable" : "ant-table-cell"}
          onClick={() => editExamTableClicked && handleCellClick(record, "class1")}>
          {projects.map((project, index) => (
            <div key={index} className="exam-table-cell">
              <a href={`/project/${project.id}`}>{project.title}</a>
              <p>
                <strong>סטודנטים:</strong>
              </p>
              <ul>
                {project.students.map((student, index) => (
                  <li key={index}>
                    {currentUser._id === student.id ? (
                      <mark style={{ backgroundColor: "#ffc069" }}>{student.name}</mark>
                    ) : (
                      student.name
                    )}
                  </li>
                ))}
              </ul>
              <p>
                <strong>שופטים:</strong>
              </p>
              <ul>
                {project.judges.map((judge, index) => (
                  <li key={index}>
                    {currentUser._id === judge.id ? (
                      <mark style={{ backgroundColor: "#ffc069" }}>{judge.name}</mark>
                    ) : (
                      judge.name
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ),
      width: 237.5,
    },
    {
      title: classNames.class2,
      dataIndex: "class2",
      key: "class2",
      render: (projects, record) => (
        <div
          className={editExamTableClicked ? "ant-table-cell clickable" : "ant-table-cell"}
          onClick={() => editExamTableClicked && handleCellClick(record, "class2")}>
          {projects.map((project, index) => (
            <div key={index} className="exam-table-cell">
              <a href={`/project/${project.id}`}>{project.title}</a>
              <p>
                <strong>סטודנטים:</strong>
              </p>
              <ul>
                {project.students.map((student, index) => (
                  <li key={index}>
                    {currentUser._id === student.id ? (
                      <mark style={{ backgroundColor: "#ffc069" }}>{student.name}</mark>
                    ) : (
                      student.name
                    )}
                  </li>
                ))}
              </ul>
              <p>
                <strong>שופטים:</strong>
              </p>
              <ul>
                {project.judges.map((judge, index) => (
                  <li key={index}>
                    {currentUser._id === judge.id ? (
                      <mark style={{ backgroundColor: "#ffc069" }}>{judge.name}</mark>
                    ) : (
                      judge.name
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ),
      width: 237.5,
    },
    {
      title: classNames.class3,
      dataIndex: "class3",
      key: "class3",
      render: (projects, record) => (
        <div
          className={editExamTableClicked ? "ant-table-cell clickable" : "ant-table-cell"}
          onClick={() => editExamTableClicked && handleCellClick(record, "class3")}>
          {projects.map((project, index) => (
            <div key={index} className="exam-table-cell">
              <a href={`/project/${project.id}`}>{project.title}</a>
              <p>
                <strong>סטודנטים:</strong>
              </p>
              <ul>
                {project.students.map((student, index) => (
                  <li key={index}>
                    {currentUser._id === student.id ? (
                      <mark style={{ backgroundColor: "#ffc069" }}>{student.name}</mark>
                    ) : (
                      student.name
                    )}
                  </li>
                ))}
              </ul>
              <p>
                <strong>שופטים:</strong>
              </p>
              <ul>
                {project.judges.map((judge, index) => (
                  <li key={index}>
                    {currentUser._id === judge.id ? (
                      <mark style={{ backgroundColor: "#ffc069" }}>{judge.name}</mark>
                    ) : (
                      judge.name
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ),
      width: 237.5,
    },
    {
      title: classNames.class4,
      dataIndex: "class4",
      key: "class4",
      render: (projects, record) => (
        <div
          className={editExamTableClicked ? "ant-table-cell clickable" : "ant-table-cell"}
          onClick={() => editExamTableClicked && handleCellClick(record, "class4")}>
          {projects.map((project, index) => (
            <div key={index} className="exam-table-cell">
              <a href={`/project/${project.id}`}>{project.title}</a>
              <p>
                <strong>סטודנטים:</strong>
              </p>
              <ul>
                {project.students.map((student, index) => (
                  <li key={index}>
                    {currentUser._id === student.id ? (
                      <mark style={{ backgroundColor: "#ffc069" }}>{student.name}</mark>
                    ) : (
                      student.name
                    )}
                  </li>
                ))}
              </ul>
              <p>
                <strong>שופטים:</strong>
              </p>
              <ul>
                {project.judges.map((judge, index) => (
                  <li key={index}>
                    {currentUser._id === judge.id ? (
                      <mark style={{ backgroundColor: "#ffc069" }}>{judge.name}</mark>
                    ) : (
                      judge.name
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ),
      width: 237.5,
    },
  ];

  const tabs = [
    {
      key: "1",
      label: "רשימת מנחים",
      children: (
        <Form form={form} component={false} loading={loading}>
          <Table
            style={{ width: "100%", minHeight: "770px" }}
            components={{
              body: {
                cell: EditableCell,
              },
            }}
            bordered
            dataSource={data}
            columns={mergedColumns}
            rowClassName="editable-row"
            pagination={false}
            {...(windowSize.width <= 768 && { scroll: { x: "max-content" } })}
          />
        </Form>
      ),
    },
    {
      key: "2",
      label: "מרכיבי הציון",
      children: (
        <div>
          {currentUser.isCoordinator && (
            <Form
              form={formGrades}
              onFinish={handleGradesAdd}
              layout="inline"
              style={{
                marginBottom: 16,
              }}>
              <Form.Item name="name" rules={[{ required: true, message: "הכנס שם" }]}>
                <Input placeholder="שם" style={{ width: 200, marginBottom: "10px" }} />
              </Form.Item>
              <Form.Item name="weight" rules={[{ required: true, message: "הכנס משקל" }]}>
                <InputNumber placeholder="משקל" style={{ width: 200, marginBottom: "10px" }} min={0} max={100} />
              </Form.Item>
              <Form.Item
                name="description"
                rules={[{ required: true, message: "הכנס תיאור" }]}
                style={{
                  width: windowSize.width > 768 ? 400 : windowSize.width > 626 ? 350 : 200,
                  marginBottom: "10px",
                }}>
                <Input placeholder="תיאור" />
              </Form.Item>
              <Form.Item name="date" rules={[{ required: true, message: "הכנס תאריך" }]}>
                <DatePicker placeholder="תאריך" locale={locale} style={{ width: 200, marginBottom: "10px" }} />
              </Form.Item>
              <Form.Item name="group" label={`לשנת ${configYear}`} rules={[{ required: true, message: "בחר קבוצה" }]}>
                <Select placeholder="בחר קבוצה" style={{ width: 200, marginBottom: "10px" }}>
                  <Select.Option value="all">כולם</Select.Option>
                  {thisYearGroups.map((group) => (
                    <Select.Option key={group._id} value={group._id}>
                      {group.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  שורה חדשה
                </Button>
              </Form.Item>
            </Form>
          )}
          <div className="grades-filter">
            <Select
              placeholder="סנן לפי קבוצה"
              value={selectedGroup}
              onChange={handleFilterChange}
              style={{ marginBottom: 16, width: 200 }}>
              <Select.Option value="all">כולם</Select.Option>
              {thisYearGroups.map((group) => (
                <Select.Option key={group._id} value={group._id}>
                  {group.name}
                </Select.Option>
              ))}
            </Select>
            {currentUser.isCoordinator && selectedGradeStructure && (
              <Button
                color="danger"
                variant="solid"
                onClick={() => {
                  setDeleteGradeStructureModal(true);
                }}>
                מחק מבנה ציון
              </Button>
            )}
          </div>
          <Form form={formEditGrades} component={false} loading={loading}>
            <Table
              components={{
                body: {
                  cell: EditableCell,
                },
              }}
              style={{ marginBottom: "25px" }}
              bordered
              dataSource={filteredGradesData}
              columns={gradesMergedColumns}
              rowClassName="editable-row"
              pagination={false}
              {...(windowSize.width <= 768 && { scroll: { x: "max-content" } })}
            />
          </Form>
          {currentUser.isCoordinator && (
            <div className="grade-weight-random-description-editor">
              <Editor
                placeholder="כאן אפשר לרשום דברים נוספים על מרכיבי הציון"
                value={gradeWeightDescription}
                onTextChange={handleEditorChange}
                style={{ height: "200px", wordBreak: "break-word" }}
              />
              <Button type="primary" onClick={saveRandomText} style={{ marginTop: 16 }}>
                שמור
              </Button>
            </div>
          )}
          {randomText ? (
            <div className="grade-weight-random-description">
              <h3>הערות נוספות</h3>
              <p style={{ marginTop: "20px" }} dangerouslySetInnerHTML={{ __html: processContent(randomText) }} />
              {currentUser.isCoordinator && (
                <div className="grade-weight-random-description-buttons">
                  <Button
                    color="primary"
                    variant="filled"
                    onClick={editRandomText}
                    style={{ marginTop: 16, marginLeft: 8 }}>
                    ערוך
                  </Button>
                  <Button
                    color="danger"
                    variant="filled"
                    onClick={deleteRandomText}
                    style={{ marginTop: 16, marginLeft: 8 }}>
                    מחק
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <h3>אין הערות נוספות</h3>
          )}
        </div>
      ),
    },
    {
      key: "3",
      label: "מועדי מבחנים",
      children: (
        <div className="exam-table-container">
          <div className="exam-table-header">
            {currentUser.isCoordinator && (
              <>
                <Form
                  form={examTableForm}
                  className="exam-table-form"
                  layout="inline"
                  onFinish={handleExamTableSubmit}
                  initialValues={{ group: "all" }}>
                  <div className="exam-table-form-required">
                    <Form.Item
                      className="exam-table-form-item"
                      label={`בחר קבוצה ליצירת טבלה (לשנת ${configYear})`}
                      name="group"
                      rules={[{ required: true, message: "בחר קבוצה" }]}>
                      <Select
                        value={selectedGroup}
                        placeholder="בחר קבוצה"
                        style={{ width: 200 }}
                        onChange={(value) => setSelectedGroup(value)}>
                        <Select.Option value="all">לכולם</Select.Option>
                        {groups
                          .filter((group) => group.year === configYear)
                          .map((group) => (
                            <Select.Option key={group._id} value={group._id}>
                              {group.name}
                            </Select.Option>
                          ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      className="exam-table-form-item"
                      label="שיטת יצירת טבלה"
                      name="creationMethod"
                      rules={[{ required: true, message: "בחר שיטה" }]}>
                      <Select placeholder="בחר שיטה" style={{ width: 200 }}>
                        <Select.Option value="ai">AI</Select.Option>
                        <Select.Option value="manual">ידני</Select.Option>
                      </Select>
                    </Form.Item>
                  </div>
                  <p>*לא חובה לבחור כיתות או תאריך בשלב זה</p>
                  <div className="exam-table-classes">
                    <Form.Item name="class1" label="כיתה 1">
                      <Input placeholder="הכנס כיתה" style={{ width: 150 }} />
                    </Form.Item>
                    <Form.Item name="class2" label="כיתה 2">
                      <Input placeholder="הכנס כיתה" style={{ width: 150 }} />
                    </Form.Item>
                    <Form.Item name="class3" label="כיתה 3">
                      <Input placeholder="הכנס כיתה" style={{ width: 150 }} />
                    </Form.Item>
                    <Form.Item name="class4" label="כיתה 4">
                      <Input placeholder="הכנס כיתה" style={{ width: 150 }} />
                    </Form.Item>
                    <Form.Item name="date" label="תאריך התחלה">
                      <DatePicker placeholder="תאריך" locale={locale} style={{ width: 150 }} />
                    </Form.Item>
                  </div>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      צור טבלה
                    </Button>
                    {loading && <p>זה יכול לקחת כמה דקות...</p>}
                  </Form.Item>
                </Form>
                <Divider />
              </>
            )}
            <div className="show-exam-table">
              <Select
                value={selectedYear}
                style={{ width: 200 }}
                placeholder="בחר שנה להצגה"
                onChange={(value) => setSelectedYear(value)}>
                {years.map((year) => (
                  <Select.Option key={year} value={year}>
                    {year}
                  </Select.Option>
                ))}
              </Select>
              <Select
                value={selectedTable}
                style={{ width: 200 }}
                placeholder="בחר טבלה להצגה"
                onChange={(value) => {
                  handleShowTableData(value);
                  setEditExamTableClicked(false);
                }}>
                {allTables
                  .filter((table) => table.year === selectedYear)
                  .map((table) => (
                    <Select.Option key={table._id} value={table._id}>
                      {table.name}
                    </Select.Option>
                  ))}
              </Select>
              {currentUser.isCoordinator && selectedTable && (
                <div className="exam-table-buttons">
                  <Button type="primary" onClick={handleEditDatesButtonClick}>
                    ערוך תאריך
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      setEditClassesModal(true);
                      formEditClasses.setFieldsValue(classNames);
                    }}>
                    ערוך כיתות
                  </Button>
                  {editExamTableClicked ? (
                    <Button type="primary" onClick={() => setEditExamTableClicked(false)}>
                      סיים עריכה
                    </Button>
                  ) : (
                    <Button type="primary" onClick={() => setEditExamTableClicked(true)}>
                      ערוך טבלה
                    </Button>
                  )}
                  <Button type="primary" danger onClick={() => setDeleteTableModal(true)}>
                    מחק טבלה
                  </Button>
                </div>
              )}
              {selectedTable && <FileExcelOutlinedIcon />}
            </div>
          </div>
          <h2>{examDates.length > 0 && examDates.join(" - ")}</h2>
          <Table
            dataSource={getCurrentPageData()}
            columns={examTableColumns}
            pagination={false}
            loading={loading}
            bordered
            scroll={{ x: "max-content" }}
          />
          <Pagination
            current={currentPage}
            total={totalPages * 9}
            pageSize={9}
            onChange={handlePageChange}
            style={{ marginTop: 16, textAlign: "center" }}
          />
        </div>
      ),
    },
    {
      key: "4",
      label: "קבצים נוספים",
      children: (
        <div>
          {currentUser.isCoordinator && (
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
                <Input
                  type="text"
                  id="title"
                  placeholder="כותרת לקובץ (אם לא הוכנס שם הקובץ יהיה גם הכותרת)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="form-input-group template-input-group">
                <Editor
                  placeholder="תיאור לקובץ"
                  value={description}
                  onTextChange={handleFileEditorChange}
                  style={{ height: "320px", wordBreak: "break-word" }}
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
            </div>
          )}
          <div className="template-content">
            {moreInformationFiles.length === 0 && <h2>לא הועלו עדיין קבצים</h2>}
            {moreInformationFiles.map((file) => (
              <FileCard
                key={file._id}
                file={file}
                destination={"moreInformation"}
                onDelete={handleDelete}
                onEdit={() => setEditingFile(file._id)}
              />
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="info-container">
      <Tabs items={tabs} defaultActiveKey={"1"} />
      <Modal
        className="edit-modal"
        title="תיאור הקובץ"
        open={isEditingFile}
        onOk={() => handleEdit(currentFile._id)}
        onCancel={() => setIsEditingFile(false)}
        okText="שמירה"
        cancelText="ביטול">
        <div className="form-input-group template-input-group">
          <label htmlFor="title">כותרת</label>
          <Input
            type="text"
            id="title"
            placeholder="כותרת לקובץ"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
        </div>
        <div className="form-input-group template-input-group">
          <label htmlFor="description">תיאור</label>
          <Editor
            placeholder="תיאור לקובץ"
            value={editDescription}
            onTextChange={handleEditFileEditorChange}
            style={{ height: "320px", wordBreak: "break-word" }}
          />
        </div>
      </Modal>

      <Modal
        className="edit-modal"
        title="עריכת כיתות"
        open={editClassesModal}
        onOk={handleEditClasses}
        onCancel={() => setEditClassesModal(false)}
        okText="שמירה"
        cancelText="ביטול">
        <Form layout="vertical" form={formEditClasses}>
          <Form.Item name="class1" label="כיתה 1" rules={[{ required: true, message: "הכנס כיתה" }]}>
            <Input placeholder="הכנס כיתה" />
          </Form.Item>
          <Form.Item name="class2" label="כיתה 2" rules={[{ required: true, message: "הכנס כיתה" }]}>
            <Input placeholder="הכנס כיתה" />
          </Form.Item>
          <Form.Item name="class3" label="כיתה 3" rules={[{ required: true, message: "הכנס כיתה" }]}>
            <Input placeholder="הכנס כיתה" />
          </Form.Item>
          <Form.Item name="class4" label="כיתה 4" rules={[{ required: true, message: "הכנס כיתה" }]}>
            <Input placeholder="הכנס כיתה" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="מחיקת טבלה"
        open={deleteTableModal}
        onOk={handleDeleteTable}
        onCancel={() => setDeleteTableModal(false)}
        okText="מחק"
        cancelText="ביטול"
        okButtonProps={{ danger: true }}>
        <p>האם אתה בטוח שברצונך למחוק את הטבלה?</p>
      </Modal>

      <Modal
        title="שיבוץ פרויקט"
        open={isAddDataModalVisible}
        onOk={handleAddData}
        onCancel={() => {
          setIsAddDataModalVisible(false);
          setSelectedProject("");
          setSelectedGroupToAddProject("");
          formAddData.resetFields();
        }}
        okText="הוסף"
        cancelText="ביטול">
        <p>שים לב לשופטים שנמצאים באותו הזמן!</p>
        <Form form={formAddData} layout="vertical">
          <Form.Item name="group" label="בחר קבוצה לפרויקטים ספיציפים">
            <Select
              value={selectedGroupToAddProject}
              placeholder="בחר קבוצה"
              onChange={(value) => {
                getSelectedGroupProjects(value);
                formAddData.setFieldsValue({ project: "", students: "", judges: "" });
              }}>
              {groups
                .filter((group) => group.year === selectedYear)
                .map((group) => (
                  <Select.Option key={group._id} value={group._id}>
                    {group.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          {selectedGroupToAddProject !== "" ? (
            <Form.Item name="project" label="בחר פרויקט" rules={[{ required: true, message: "בחר פרויקט" }]}>
              <Select value={selectedProject} placeholder="בחר פרויקט" onChange={handleProjectChange}>
                {selectedGroupProjects
                  .filter((project) => !selectedTableProjects.includes(project._id) && project.year === selectedYear)
                  .map((project) => (
                    <Select.Option key={project._id} value={project._id}>
                      {project.title}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
          ) : (
            <Form.Item name="project" label="בחר פרויקט" rules={[{ required: true, message: "בחר פרויקט" }]}>
              <Select value={selectedProject} placeholder="בחר פרויקט" onChange={handleProjectChange}>
                {projects
                  .filter((project) => !selectedTableProjects.includes(project._id) && project.year === selectedYear)
                  .map((project) => (
                    <Select.Option key={project._id} value={project._id}>
                      {project.title}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="students" label="סטודנטים">
            <Input disabled />
          </Form.Item>
          <Form.Item name="judges" label="שופטים">
            <Input disabled />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="למחוק את שיבוץ הפרויקט?"
        open={isDeleteDataModalVisible}
        onOk={handleDeleteCell}
        onCancel={() => setIsDeleteDataModalVisible(false)}
        okText="מחק"
        cancelText="ביטול"
        okButtonProps={{ danger: true }}></Modal>

      <Modal
        title="עריכת תאריכים"
        open={editDatesModal}
        onOk={handleEditDates}
        onCancel={() => setEditDatesModal(false)}
        okText="שמירה"
        cancelText="ביטול">
        <Form layout="vertical" form={editDatesForm}>
          {examDates.map((date, index) => (
            <Form.Item
              key={index}
              name={["dates", index]}
              label={`תאריך ${index + 1}`}
              rules={[{ required: true, message: "הכנס תאריך" }]}>
              <DatePicker placeholder="תאריך" locale={locale} />
            </Form.Item>
          ))}
        </Form>
      </Modal>

      <Modal
        title="מחיקת מבנה ציון"
        open={deleteGradeStructureModal}
        onOk={handleDeleteGradeStructure}
        onCancel={() => setDeleteGradeStructureModal(false)}
        okText="מחק"
        cancelText="ביטול"
        okButtonProps={{ danger: true }}>
        <p>האם אתה בטוח שברצונך למחוק את מבנה הציון?</p>
      </Modal>
    </div>
  );
};

export default MoreInformation;
