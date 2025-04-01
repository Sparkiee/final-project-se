import React, { useState, useEffect, useContext } from "react";
import "./CreateUser.scss";
import { DeleteOutlined, InboxOutlined } from "@ant-design/icons";
import axios from "axios";
import * as XLSX from "xlsx";
import { Popconfirm } from "antd";
import { Button, Form, Input, Select, message, Upload, Table, Checkbox, Tooltip, Divider } from "antd";
import { NotificationsContext } from "../../utils/NotificationsContext";
const { Dragger } = Upload;

const CreateUser = () => {
  const { fetchNotifications } = useContext(NotificationsContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
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

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const registerValues = {
        name: values.name,
        email: values.email,
        id: values.userId,
        password: values.userId,
        isStudent: values.role.includes("student"),
        isAdvisor: values.role.includes("advisor"),
        isJudge: values.role.includes("judge"),
        isCoordinator: values.role.includes("coordinator"),
      };

      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/user/register`, registerValues, {
        withCredentials: true,
      });
      // await axios.post(
      //     `${process.env.REACT_APP_BACKEND_URL}/api/email/create-user`,
      //     { email: values.email },
      //     { withCredentials: true },
      // );
      message.success("משתמש נוצר בהצלחה");
      form.resetFields();
    } catch (error) {
      if (error.response.data === "Email already in use") {
        message.error("כתובת המייל כבר קיימת במערכת");
      } else if (error.response.data === "ID already in use") {
        message.error("תעודת הזהות כבר קיימת במערכת");
      } else {
        message.error("שגיאה ביצירת משתמש");
      }
      console.error("Error creating user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCSV = async (users) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/user/register-multiple`, users, {
        withCredentials: true,
      });
      message.success("משתמשים נוצרו בהצלחה");
      if (response.data.existingUsers.length > 0) {
        message.warning(
          `המשתמשים הבאים כבר קיימים במערכת: ${response.data.existingUsers.map((user) => user.email).join(", ")}`
        );
      }
      const usersData = users.filter((user) =>
        response.data.existingUsers.some((existingUser) => existingUser.email === user.email)
      );
      setUsers(usersData);
    } catch (error) {
      if (error.response.data === "Email already in use") {
        message.error("כתובת המייל כבר קיימת במערכת");
      } else if (error.response.data === "ID already in use") {
        message.error("תעודת הזהות כבר קיימת במערכת");
      } else {
        message.error("שגיאה ביצירת משתמשים");
      }
      console.error("Error creating users:", error);
    }
  };

  // const handleUploadFile = async (file) => {
  //   Papa.parse(file, {
  //     header: true,
  //     complete: async (result) => {
  //       console.log(result);
  //       const parsedData = result.data
  //         .map((row, index) => ({
  //           key: index,
  //           email: row['דוא"ל'],
  //           firstName: row["שם פרטי"],
  //           lastName: row["שם משפחה"],
  //           name: `${row["שם פרטי"]} ${row["שם משפחה"]}`,
  //           id: row["ת.ז."],
  //           role: ["isStudent"],
  //         }))
  //         .filter((row) => row.email && row.firstName && row.lastName); // Filter out rows with undefined or empty values

  //       setUsers(parsedData);
  //     },
  //   });
  //   return false;
  // };

  const handleUploadFile = async (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0]; // Get first sheet
      const sheet = workbook.Sheets[sheetName];

      // Convert to JSON, treating CSV and XLSX the same way
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      console.log(jsonData);
      processParsedData(jsonData);
    };

    reader.readAsArrayBuffer(file); // Read the file as binary

    return false;
  };

  const processParsedData = (data) => {
    const parsedData = data
      .map((row, index) => ({
        key: index,
        email: row['דוא"ל'] || row["דואר אלקטרוני"] || row["אימייל"] || row["email"],
        firstName: row["שם פרטי"] || row["first_name"],
        lastName: row["שם משפחה"] || row["last_name"],
        name:
          row["שם פרטי"] && row["שם משפחה"]
            ? `${row["שם פרטי"]} ${row["שם משפחה"]}`
            : `${row["first_name"]} ${row["last_name"]}`,
        id: row["ת.ז."] || row["תעודת זהות"] || row['ת"ז'] || row["id"],
        role: ["isStudent"],
      }))
      .filter((row) => row.email && row.firstName && row.lastName);
    setUsers(parsedData);
  };

  const handleRemoveUser = (record) => {
    const filteredUsers = users.filter((user) => user.id !== record.id);
    setUsers(filteredUsers);
  };

  const props = {
    name: "file",
    maxCount: 1,
    accept: ".csv, .xlsx, .xls",
    beforeUpload: handleUploadFile,
    customRequest: ({ onSuccess }) => {
      onSuccess("ok");
    },
    showUploadList: false,
  };

  const roleOptions = [
    { label: "סטודנט", value: "isStudent" },
    { label: "מנחה", value: "isAdvisor" },
    { label: "שופט", value: "isJudge" },
    { label: "מנהל", value: "isCoordinator" },
  ];

  const columns = [
    {
      title: "שם מלא",
      dataIndex: "name",
      key: "name",
      fixed: windowSize.width > 626 && "left",
      render: (text) => <div>{text.length > 45 ? text.substring(0, 45) + "..." : text}</div>,
    },
    {
      title: "ת.ז.",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "אימייל",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "תפקיד",
      dataIndex: "role",
      key: "role",
      render: (text, record) => (
        <div>
          <Checkbox.Group
            options={roleOptions}
            defaultValue={record.role || ["isStudent"]}
            onChange={(checkedValues) => {
              const updatedUsers = users.map((user) => {
                if (user.email === record.email && user.id === record.id) {
                  return { ...user, role: checkedValues };
                }
                return user;
              });
              setUsers(updatedUsers);
            }}
          />
        </div>
      ),
    },
    {
      title: "פעולות",
      key: "action",
      render: (record) => (
        <span className="user-actions">
          <Tooltip title="הסר משתמש מרשימה">
            <Popconfirm
              title="הסרת משתמש מרשימה"
              description={`האם ברצונך להסיר את ${record.name}?`}
              okText="הסר"
              cancelText="בטל"
              onConfirm={() => handleRemoveUser(record)}>
              <DeleteOutlined />
            </Popconfirm>
          </Tooltip>
        </span>
      ),
    },
  ];
  return (
    <div className="create-user">
      <h1>יצירת משתמש חדש</h1>
      <Form className="create-user-form" form={form} name="createUser" layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="שם מלא"
          name="name"
          hasFeedback
          rules={[
            {
              required: true,
              message: "חובה להזין שם מלא",
            },
          ]}>
          <Input />
        </Form.Item>
        <Form.Item
          label="ת.ז."
          name="userId"
          hasFeedback
          rules={[
            {
              required: true,
              message: "חובה להזין ת.ז.",
            },
            { pattern: /^\d{9}$/, message: "תעודת זהות חייבת להכיל 9 ספרות" },
          ]}>
          <Input />
        </Form.Item>
        <Form.Item
          label="אימייל"
          name="email"
          hasFeedback
          rules={[
            {
              required: true,
              message: "חובה להזין כתובת מייל",
            },
            {
              type: "email",
              message: "נא להזין כתובת מייל תקינה",
            },
          ]}>
          <Input />
        </Form.Item>
        <Form.Item
          label="תפקיד"
          name="role"
          rules={[
            {
              required: true,
              message: "חובה לבחור תפקיד",
            },
          ]}>
          <Select mode="multiple">
            <Select.Option value="student">סטודנט</Select.Option>
            <Select.Option value="advisor">מנחה</Select.Option>
            <Select.Option value="judge">שופט</Select.Option>
            <Select.Option value="coordinator">מנהל</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item className="create-user-buttons">
          <Button color="danger" variant="outlined" onClick={() => form.resetFields()} disabled={loading}>
            אפס טופס
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            צור משתמש חדש
          </Button>
        </Form.Item>
      </Form>
      <div className="upload-users-csv">
        <Divider />
        <h2 style={{ textAlign: "center" }}>יצירת משתמשים מקובץ</h2>
        <Dragger className="uploader-users-csv" {...props}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="uploader-title">יצירת משתמשים מקובץ</p>
          <p className="ant-upload-text">לחצו או גררו כדי להעלות קובץ</p>
          <p className="ant-upload-hint">יש להעלות קובץ CSV יחיד עם השורות הבאות: דוא"ל, שם פרטי, שם משפחה, ת"ז</p>
        </Dragger>
        {users.length > 0 && (
          <div className="users-csv">
            <Table
              columns={columns}
              dataSource={users}
              scroll={{
                x: "max-content",
              }}
            />
            <Button type="primary" className="submit-csv" onClick={() => handleSubmitCSV(users)}>
              צור משתמשים
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateUser;
