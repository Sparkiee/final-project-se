import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import "./SystemControl.scss";
import {
  Button,
  Switch,
  Form,
  Input,
  InputNumber,
  Table,
  Typography,
  message,
  Tooltip,
  Modal,
  Select,
  Radio,
} from "antd";
import { EditOutlined, SaveOutlined, StopOutlined, DeleteOutlined } from "@ant-design/icons";
import { toJewishDate, formatJewishDateInHebrew } from "jewish-date";
import { NotificationsContext } from "../../utils/NotificationsContext";
import { downloadProjectExcel, downloadGradesExcel } from "../../utils/ProjectTableExcel";

const SystemControl = () => {
  const [manageStudents, setManageStudents] = useState(true);
  const { fetchNotifications } = useContext(NotificationsContext);
  const [currentYear, setCurrentYear] = useState("");
  const [outputYear, setOutputYear] = useState("");
  const [years, setYears] = useState([]);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [letterToNumber, setLetterToNumber] = useState({
    "A+": null,
    A: null,
    "A-": null,
    "B+": null,
    B: null,
    "B-": null,
    "C+": null,
    C: null,
    "C-": null,
    "D+": null,
    D: null,
    "D-": null,
    E: null,
    F: null,
  });
  const [submissions, setSubmissions] = useState([]);
  const [submissionGroups, setSubmissionGroups] = useState({});
  const [groupsData, setGroupsData] = useState([]);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [currentSubmissionName, setCurrentSubmissionName] = useState("");
  const [currentGroup, setCurrentGroup] = useState("");
  const [refreshSubmissions, setRefreshSubmissions] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [gradingTableToDelete, setGradingTableToDelete] = useState(null);
  const [gradingTableYear, setGradingTableYear] = useState("");
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

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/grade/get-all-numeric-values`, {
        withCredentials: true,
      });
      // Filter the grading tables by the selected year
      const filteredData = response.data.filter((table) => table.year === gradingTableYear);
      setGroupsData(filteredData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching grades:", error);
      message.error("שגיאה בטעינת הציונים");
      setLoading(false);
    }
  };

  const fetchConfigurations = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/config/get-config`, {
        withCredentials: true,
      });
      setManageStudents(response.data.projectStudentManage);
      const currentYear = response.data.currentYear;
      setCurrentYear(currentYear);
      setOutputYear(currentYear);
      setGradingTableYear(currentYear);

      const today = new Date();
      const currentHebrewDate = toJewishDate(today);

      // Format years into Hebrew letters
      const formattedCurrentYear = formatJewishDateInHebrew(currentHebrewDate).split(" ").pop().replace(/^ה/, ""); // Remove "ה" prefix if needed

      // Create new Date objects for previous and next years to avoid mutating 'today'
      const previousDate = new Date(today);
      previousDate.setFullYear(today.getFullYear() - 1);
      const formattedPreviousYear = formatJewishDateInHebrew(toJewishDate(previousDate))
        .split(" ")
        .pop()
        .replace(/^ה/, "");

      const nextDate = new Date(today);
      nextDate.setFullYear(today.getFullYear() + 1);
      const formattedNextYear = formatJewishDateInHebrew(toJewishDate(nextDate)).split(" ").pop().replace(/^ה/, "");

      // Set the years array
      const yearsArray = [formattedNextYear, formattedCurrentYear, formattedPreviousYear];
      setYears(yearsArray);
    } catch (error) {
      console.error("Error fetching configurations:", error);
      message.error("שגיאה בטעינת ההגדרות");
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchGrades();
    fetchConfigurations();
    fetchNotifications();
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchSubmissions = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/submission/get-all`, {
          withCredentials: true,
        });
        setSubmissions(response.data);

        const thisYearSubmissions = response.data.filter((submission) => submission.projectYear === gradingTableYear);

        const groups = thisYearSubmissions.reduce((acc, submission) => {
          if (!acc[submission.name]) {
            acc[submission.name] = [];
          }
          acc[submission.name].push(submission);
          return acc;
        }, {});

        const filteredGroups = Object.keys(groups).reduce((acc, submissionName) => {
          const group = groups[submissionName];
          const checkForGraded = group.filter((submission) => submission.isGraded || submission.isReviewed);
          const allGroups = checkForGraded.every((submission) =>
            submission.gradesDetailed.every((grade) => grade.editable === false)
          );
          if (!allGroups) {
            acc[submissionName] = {
              submissions: group,
              status: group.some((submission) => submission.isGraded) ? "graded" : "reviewed",
            };
          }
          return acc;
        }, {});
        setSubmissionGroups(filteredGroups);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching submissions:", error);
        message.error("שגיאה בטעינת ההגשות");
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [refreshSubmissions, gradingTableYear]);

  useEffect(() => {
    setLoading(true);
    fetchGrades();
  }, [gradingTableYear]);

  const isEditing = (record) => record.key === editingKey;

  const EditableCell = ({ editing, dataIndex, title, inputType, record, index, children, ...restProps }) => {
    const inputNode = inputType === "number" ? <InputNumber min={0} max={100} /> : <Input />;
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

  const cancel = () => {
    setEditingKey("");
    form.resetFields();
  };

  const save = async (name) => {
    try {
      const row = await form.validateFields();
      const updatedValues = { ...row };
      delete updatedValues.name;

      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/grade/update-numeric-values`,
        { updatedValues, name, year: gradingTableYear },
        { withCredentials: true }
      );
      message.success("הציון עודכן בהצלחה");
      fetchGrades();
      setRefreshSubmissions((prev) => !prev);
      setEditingKey("");
    } catch (error) {
      console.error("Error updating grade:", error);
      message.error("שגיאה בעדכון הציון");
    }
  };

  const publishGradesForSubmissions = async (submissionName, group) => {
    setLoading(true);
    setConfirmModalVisible(false);
    const groupSubmissions = submissionGroups[submissionName].submissions.filter((submission) => submission.editable);

    if (groupSubmissions[0].isGraded) {
      const gradedSubmissions = groupSubmissions.filter(
        (submission) =>
          submission.isGraded === true &&
          submission.gradesDetailed.some(
            (grade) => grade.editable === true && grade.grade !== null && grade.grade !== undefined
          )
      );
      if (gradedSubmissions.length === 0) {
        setLoading(false);
        return message.info("עדיין לא ניתן לפרסם כי אין ציונים");
      }
    }

    if (groupSubmissions[0].isReviewed) {
      const reviewedSubmissions = groupSubmissions.filter(
        (submission) =>
          submission.isReviewed === true &&
          submission.gradesDetailed.some(
            (grade) => grade.editable === true && grade.videoQuality !== undefined && grade.videoQuality !== null
          )
      );
      if (reviewedSubmissions.length === 0) {
        setLoading(false);
        return message.info("עדיין לא ניתן לפרסם כי אין ביקורות");
      }
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/grade/publish-grades`,
        { submissionName, year: gradingTableYear, group },
        { withCredentials: true }
      );
      message.success("הציונים/ביקורות הזמינים פורסמו בהצלחה");
      setRefreshSubmissions((prev) => !prev);
    } catch (error) {
      console.error("Error ending judging period:", error);
      if (error.response.status === 400) {
        message.error(`חסר ערך נומרי עבור הציון ${error.response.data.grade}`);
      } else {
        message.error("שגיאה בפרסום הציונים");
      }
    } finally {
      setLoading(false);
    }
  };

  const checkZeroGrades = (submissionName, group) => {
    const gradingTable = groupsData.find((table) => table.name === submissionName && table.year === gradingTableYear);

    if (!gradingTable) {
      message.error("טבלת הציונים לא נמצאה");
      return;
    }

    const hasZeroGrade = Object.values(gradingTable)
      .filter((value) => typeof value === "number")
      .some((value) => value === 0);

    if (hasZeroGrade) {
      setCurrentSubmissionName(submissionName);
      setCurrentGroup(group);
      setConfirmModalVisible(true);
      setLoading(false);
      return;
    }

    publishGradesForSubmissions(submissionName, group);
  };

  const handleCalculationMethodChange = async (submissionName, value) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/grade/update-calculation-method`,
        { submissionName, year: gradingTableYear, averageCalculation: value },
        { withCredentials: true }
      );

      // Refresh the data to show the updated calculation method
      setRefreshSubmissions((prev) => !prev);
      fetchGrades();
      message.success("שיטת החישוב עודכנה בהצלחה");
    } catch (error) {
      console.error("Error updating calculation method:", error);
      message.error("שגיאה בעדכון שיטת החישוב");
    }
  };

  const handleDelete = async () => {
    if (!gradingTableToDelete) return;

    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/grade/delete-grading-table`, {
        data: { name: gradingTableToDelete.name, year: gradingTableYear },
        withCredentials: true,
      });
      message.success("טבלת הציונים נמחקה בהצלחה");
      fetchGrades();
      setDeleteModalVisible(false);
      setGradingTableToDelete(null);
    } catch (error) {
      if (error.response?.status === 400) {
        message.error("לא ניתן למחוק את טבלת הציונים מכיוון שהיא בשימוש");
      } else if (error.response?.status === 404) {
        message.error("טבלת הציונים לא נמצאה");
      } else {
        message.error("שגיאה במחיקת טבלת הציונים");
        console.error("Error deleting grading table:", error);
      }
    }
  };

  const showDeleteModal = (record) => {
    setGradingTableToDelete(record);
    setDeleteModalVisible(true);
  };

  const columns = [
    {
      title: "הגשה",
      dataIndex: "name",
      key: "name",
      fixed: windowSize.width > 626 && "left",
      render: (text) => (
        <span>{text.length > 40 ? <Tooltip title={text}>{text.substring(0, 40)}...</Tooltip> : text}</span>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
      defaultSortOrder: "ascend",
      width:
        windowSize.width > 1920
          ? "15%"
          : windowSize.width <= 1920 && windowSize.width > 1024
          ? 300
          : windowSize.width > 768
          ? 250
          : 150,
    },
    ...Object.keys(letterToNumber).map((letter) => ({
      title: <p style={{ direction: "ltr", margin: "0", textAlign: "right" }}>{letter}</p>,
      dataIndex: letter,
      key: letter,
      editable: true,
      render: (text) => (text !== null ? text : ""),
      sorter: (a, b) => (a[letter] || 0) - (b[letter] || 0),
      width:
        windowSize.width > 1920
          ? `${80 / Object.keys(letterToNumber).length}%`
          : windowSize.width <= 1920 && windowSize.width > 1024
          ? 120
          : 120,
    })),
    {
      title: "צורת חישוב",
      dataIndex: "averageCalculation",
      key: "averageCalculation",
      render: (text, record) => (
        <Radio.Group
          value={record.averageCalculation}
          onChange={(e) => handleCalculationMethodChange(record.name, e.target.value)}>
          <Radio value={false}>חציון</Radio>
          <Radio value={true}>ממוצע</Radio>
        </Radio.Group>
      ),
      width: windowSize.width > 1920 ? "10%" : windowSize.width <= 1920 && windowSize.width > 1024 ? 150 : 150,
    },
    {
      title: "פעולות",
      dataIndex: "actions",
      key: "actions",
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link
              onClick={() => save(record.name)}
              style={{
                marginInlineEnd: 8,
              }}>
              <Tooltip title="שמירה">
                <SaveOutlined className="edit-icon" />
              </Tooltip>
            </Typography.Link>
            <Tooltip title="ביטול">
              <StopOutlined className="edit-icon cancel" onClick={cancel} />
            </Tooltip>
          </span>
        ) : (
          <>
            <Typography.Link onClick={() => edit(record)}>
              <Tooltip title="עריכה">
                <EditOutlined className="edit-icon" />
              </Tooltip>
            </Typography.Link>
            <Tooltip title="מחיקה">
              <DeleteOutlined className="edit-icon cancel" onClick={() => showDeleteModal(record)} />
            </Tooltip>
          </>
        );
      },
      width: windowSize.width > 1920 ? "5%" : windowSize.width <= 1920 && windowSize.width > 1024 ? 100 : 100,
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        inputType: "number",
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const handleStartProjects = async (year) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/project/start-projects-coordinator`,
        { year },
        { withCredentials: true }
      );
      message.success("הפרויקטים הופעלו בהצלחה");
    } catch (error) {
      if (error.response.status !== 304) {
        console.error("Error starting projects:", error);
      }
      message.error("אין פרויקטים זמינים להפעלה");
    }
  };

  const handleDownloadProjectsExcel = async (year) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/project/get-projects-by-year/${year}`,
        {
          withCredentials: true,
        }
      );
      downloadProjectExcel(response.data, year);
    } catch (error) {
      console.error("Error downloading projects excel:", error);
      message.error("שגיאה בהורדת קובץ הפרויקטים");
    }
  };

  const handleDownloadGradesExcel = async (year) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/project/calculate-final-grades`, {
        params: { year },
        withCredentials: true,
      });
      const projectsWithGrades = response.data.filter((project) => project.totalGrade !== null);

      if (projectsWithGrades.length !== 0) {
        downloadGradesExcel(projectsWithGrades, year);
      } else {
        message.info("אין ציונים זמינים להורדה");
      }
    } catch (error) {
      console.error("Error downloading grades excel:", error);
      message.error("שגיאה בהורדת קובץ הציונים");
    }
  };

  return (
    <div className="system">
      <div className="control-options">
        <div className="box switches">
          <h3 className="box-title">ניהול פרויקטים</h3>
          <div className="switch">
            <Tooltip title="אישור, דחיה והסרה של סטודנטים מפרויקט">
              <label className="switch-label">ניהול סטודנטים בפרויקט</label>
            </Tooltip>
            <Switch
              checked={manageStudents}
              onChange={() => {
                try {
                  setManageStudents(!manageStudents);
                  axios.post(
                    `${process.env.REACT_APP_BACKEND_URL}/api/config/update-config`,
                    { projectStudentManage: !manageStudents },
                    { withCredentials: true }
                  );
                } catch (error) {
                  console.error("Error updating configuration:", error);
                  message.error("שגיאה בעדכון ההגדרות");
                }
              }}
            />
          </div>
          <div className="switch">
            <Tooltip title="פרויקטים שיש סטודנטים אבל המנחה לא סגר הרשמה">
              <label className="switch-label">התחל פרויקטים</label>
            </Tooltip>
            <Button type="primary" onClick={() => handleStartProjects(currentYear)}>
              התחל
            </Button>
          </div>
          <div className="switch">
            <label className="switch-label">בחירת שנת מערכת</label>
            <Select
              value={currentYear}
              onChange={(value) => {
                setCurrentYear(value);
                try {
                  axios.post(
                    `${process.env.REACT_APP_BACKEND_URL}/api/config/update-config`,
                    { currentYear: value },
                    { withCredentials: true }
                  );
                } catch (error) {
                  console.error("Error updating configuration:", error);
                  message.error("שגיאה בעדכון ההגדרות");
                }
              }}>
              {years.map((year) => (
                <Select.Option key={year} value={year}>
                  {year}
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>
        <div className="box publish-grades">
          <h3 className="box-title">פרסום ציונים/ביקורות</h3>
          {Object.keys(submissionGroups).map((submissionName) => (
            <div key={submissionName} className="publish-button">
              {submissionGroups[submissionName].status === "graded" && (
                <>
                  <label>
                    פרסם ציונים זמינים עבור{" "}
                    {submissionName.length > 20 ? (
                      <Tooltip title={submissionName}>{submissionName.substring(0, 20)}...</Tooltip>
                    ) : (
                      submissionName
                    )}
                  </label>
                  <Button
                    type="primary"
                    loading={loading}
                    onClick={() => checkZeroGrades(submissionName, submissionName)}>
                    פרסם ציונים
                  </Button>
                </>
              )}
              {submissionGroups[submissionName].status === "reviewed" && (
                <>
                  <label>
                    פרסם משובים זמינים עבור{" "}
                    {submissionName.length > 20 ? (
                      <Tooltip title={submissionName}>{submissionName.substring(0, 20)}...</Tooltip>
                    ) : (
                      submissionName
                    )}
                  </label>
                  <Button
                    type="primary"
                    loading={loading}
                    onClick={() => publishGradesForSubmissions(submissionName, submissionName)}>
                    פרסם משובים
                  </Button>
                </>
              )}
            </div>
          ))}
          {Object.keys(submissionGroups).length === 0 && <p>אין הגשות זמינות לפרסום</p>}
        </div>
        <div className="box site-output">
          <h3 className="box-title">פלט האתר</h3>
          <div className="output-item">
            <label className="output-label">בחירת שנה</label>
            <Select
              style={{ width: "100px" }}
              value={outputYear}
              onChange={(value) => {
                setOutputYear(value);
              }}>
              {years.map((year) => (
                <Select.Option key={year} value={year}>
                  {year}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="output-item">
            <label className="output-label">פרויקטים</label>
            <Button type="primary" onClick={() => handleDownloadProjectsExcel(outputYear)}>
              הורדת קובץ
            </Button>
          </div>
          <div className="output-item">
            <label className="output-label">ציונים</label>
            <Button type="primary" onClick={() => handleDownloadGradesExcel(outputYear)}>
              הורדת קובץ
            </Button>
          </div>
        </div>
      </div>
      <div className="grades-table">
        <Select
          value={gradingTableYear}
          onChange={(value) => setGradingTableYear(value)}
          style={{ width: "200px", marginBottom: "10px", marginTop: "10px" }}>
          {years.map((year) => (
            <Select.Option key={year} value={year}>
              {year}
            </Select.Option>
          ))}
        </Select>
        <Form form={form} component={false} loading={loading}>
          <Table
            style={{ width: "100%" }}
            loading={loading}
            showSorterTooltip={false}
            components={{
              body: {
                cell: EditableCell,
              },
            }}
            bordered
            dataSource={groupsData.map((group) => ({ ...group, key: group.name }))}
            columns={mergedColumns}
            rowClassName="editable-row"
            pagination={false}
            scroll={{
              x: "max-content",
            }}
          />
        </Form>
      </div>
      <Modal
        title={`פרסום ציונים ל${currentGroup}`}
        open={confirmModalVisible}
        onOk={() => publishGradesForSubmissions(currentSubmissionName, currentGroup)}
        onCancel={() => setConfirmModalVisible(false)}
        okText="אשר"
        cancelText="בטל">
        <p>ישנם ציונים עם ערך נומרי של 0. האם אתה בטוח שברצונך לפרסם את הציונים?</p>
      </Modal>
      <Modal
        title="אישור מחיקה"
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okButtonProps={{ danger: true }}
        okText="מחק"
        cancelText="בטל">
        <p>האם אתה בטוח שברצונך למחוק את טבלת הציונים עבור "{gradingTableToDelete?.name}"?</p>
        <p>לא ניתן למחוק טבלת ציונים אם ישנם הגשות פעילות.</p>
      </Modal>
    </div>
  );
};

export default SystemControl;
