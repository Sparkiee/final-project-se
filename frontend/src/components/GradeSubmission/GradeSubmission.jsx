import React, { useEffect, useState, useContext } from "react";
import "./GradeSubmission.scss";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Form, Input, Select, message, Spin } from "antd";
import { NotificationsContext } from "../../utils/NotificationsContext";

const GradeSubmission = () => {
  const navigate = useNavigate();
  const { fetchNotifications } = useContext(NotificationsContext);
  const [form] = Form.useForm();
  const { Option } = Select;
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : {};
  });
  const { submissionId } = useParams();
  const [project, setProject] = useState({});
  const [loading, setLoading] = useState(false);
  const letterGrades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E", "F"];

  useEffect(() => {
    setLoading(true);
    const fetchProjectData = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/submission/get-submission/${submissionId}`,
          {
            withCredentials: true,
          }
        );
        setProject(response.data);
        if (response.data.isReviewed || response.data.isGraded) {
          form.setFieldsValue({
            grade: response.data.existingGrade,
            videoQuality: response.data.existingVideoQuality,
            workQuality: response.data.existingWorkQuality,
            writingQuality: response.data.existingWritingQuality,
            commits: response.data.existingCommits,
            journalActive: response.data.existingJournalActive,
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching project data:", error);
        if (error.response.status === 403) {
          message.error("אין לך הרשאה לגשת לדף זה");
          navigate(-1);
        } else if (error.response.status === 404 || error.response.status === 400) {
          navigate("/wrong-path");
        } else {
          message.error("שגיאה בטעינת נתוני הפרויקט");
        }
        setLoading(false);
      }
    };

    fetchProjectData();
    fetchNotifications();
  }, [submissionId]);

  const onFinish = async (values) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/grade/add-grade`,
        {
          submissionId: submissionId,
          ...values,
        },
        {
          withCredentials: true,
        }
      );
      if (values.isGraded) {
        message.success("הציון נשמר בהצלחה");
      } else {
        message.success("המשוב נשמר בהצלחה");
      }
      form.resetFields();
      navigate("/check-submissions");
    } catch (error) {
      console.error("Error submitting grade:", error);
      message.error("שגיאה בשמירת הציון");
    }
  };

  const onReset = () => {
    form.resetFields();
  };

  return (
    <div className="grade-project-container">
      {loading ? (
        <Spin />
      ) : (
        <div className="grade-project-form">
          <h2>
            שפיטת פרויקט: <span style={{ textDecoration: "underline" }}>{project?.projectName}</span>
          </h2>
          <Form form={form} name="gradeProject" layout="vertical" onFinish={onFinish}>
            {project?.isReviewed && (
              <>
                <Form.Item
                  label="כתבו משפט על איכות הסרטון"
                  name="videoQuality"
                  rules={[
                    {
                      required: true,
                      message: "נא להזין תשובה",
                    },
                  ]}>
                  <Input />
                </Form.Item>
                <Form.Item
                  label="כתבו פסקה על איכות העבודה שנעשתה"
                  name="workQuality"
                  rules={[
                    {
                      required: true,
                      message: "נא להזין תשובה",
                    },
                  ]}>
                  <Input.TextArea rows={4} />
                </Form.Item>
                <Form.Item
                  label="כתבו משפט או יותר על איכות הכתיבה"
                  name="writingQuality"
                  rules={[
                    {
                      required: true,
                      message: "נא להזין תשובה",
                    },
                  ]}>
                  <Input.TextArea rows={4} />
                </Form.Item>
                {project?.advisorId === user._id && (
                  <>
                    <Form.Item
                      label="כמה קומיטים היו בגיט"
                      name="commits"
                      rules={[
                        {
                          required: true,
                          message: "נא להזין מספר קומיטים",
                        },
                        {
                          validator: (_, value) =>
                            value > -1 ? Promise.resolve() : Promise.reject("המספר חייב להיות חיובי"),
                        },
                      ]}>
                      <Input type="number" />
                    </Form.Item>
                    <Form.Item
                      label="האם היומן פעיל"
                      name="journalActive"
                      rules={[
                        {
                          required: true,
                          message: "נא לבחור תשובה",
                        },
                      ]}>
                      <Select>
                        <Option value="yes">כן</Option>
                        <Option value="no">לא</Option>
                      </Select>
                    </Form.Item>
                  </>
                )}
              </>
            )}
            {project?.isGraded && (
              <Form.Item
                label="ציון לפרויקט"
                name="grade"
                rules={[
                  {
                    required: true,
                    message: "נא להזין ציון",
                  },
                ]}>
                <Select>
                  {letterGrades.map((grade) => (
                    <Option key={grade} value={grade}>
                      <p style={{ direction: "ltr", margin: "0", textAlign: "right" }}>{grade}</p>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <Form.Item>
              <div className="form-buttons">
                {project?.isGraded ? (
                  <Button type="primary" htmlType="submit">
                    שמור ציון
                  </Button>
                ) : (
                  <Button type="primary" htmlType="submit">
                    שמור משוב
                  </Button>
                )}
                <Button htmlType="button" onClick={onReset}>
                  נקה טופס
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      )}
    </div>
  );
};

export default GradeSubmission;
