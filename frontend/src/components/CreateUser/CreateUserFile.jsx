import React, { useState, useEffect } from "react";
import { Steps, Table, Upload, message, Button } from "antd";
import * as XLSX from "xlsx";
import { DownloadOutlined, InboxOutlined } from "@ant-design/icons";
import "./CreateUserFile.scss";

const { Dragger } = Upload;

const steps = [
    {
        title: "העלאת קובץ ראשון",
        description: "תוכן נדרש: שם פרטי, משפחה ות.ז.",
        content: "user-id-content",
    },
    {
        title: "העלאת קובץ שני",
        description: "תוכן נדרש: שם פרטי, משפחה ואימייל",
        content: "user-email-content",
    },
    {
        title: "הורדת קובץ מותאם",
        content: "user-download-content",
    },
];

const columns = [
    {
        title: "שם פרטי",
        dataIndex: "first_name",
        key: "first_name",
    },
    {
        title: "שם משפחה",
        dataIndex: "last_name",
        key: "last_name",
    },
    {
        title: "תעודת זהות",
        dataIndex: "id",
        key: "id",
    },
    {
        title: "אימייל",
        dataIndex: "email",
        key: "email",
    },
];

const CreateUserFile = () => {
    const [step, setStep] = useState(0);
    const [users, setUsers] = useState([]);
    const [duplicatedUsers, setDuplicatedUsers] = useState([]);

    useEffect(() => {
        console.log(users);
    }, [users]);

    const handleUploadEMAILFile = (file) => {
        const fileType = file.name.split(".").pop().toLowerCase();
        if (!["csv", "xlsx", "xls"].includes(fileType)) {
            message.error("פורמט קובץ לא נתמך. יש להעלות קובץ CSV או Excel.");
            return false;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0]; // Get first sheet
                const sheet = workbook.Sheets[sheetName];
                let jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                if (jsonData.length === 0) {
                    message.error("הקובץ לא יכול להיות ריק");
                    return;
                }

                let firstRow = jsonData[0].map((col) => (typeof col === "string" ? col.toLowerCase().trim() : ""));

                const headerMappings = [
                    {
                        eng: ["first name", "firstname"],
                        heb: ["שם פרטי"],
                        key: "firstName",
                    },
                    {
                        eng: ["last name", "lastname"],
                        heb: ["שם משפחה"],
                        key: "lastName",
                    },
                    {
                        eng: ["email", "e-mail"],
                        heb: ["אימייל", "דואר אלקטרוני", 'דוא"ל'],
                        key: "email",
                    },
                ];

                // Find column indices by checking all possible header options
                const columnIndex = {};
                headerMappings.forEach((mapping) => {
                    let index = -1;

                    // Check English headers
                    mapping.eng.forEach((header) => {
                        if (firstRow.includes(header.toLowerCase())) {
                            index = firstRow.indexOf(header.toLowerCase());
                        }
                    });

                    // Check Hebrew headers (only if English wasn't found)
                    if (index === -1) {
                        mapping.heb.forEach((header) => {
                            if (firstRow.includes(header.toLowerCase())) {
                                index = firstRow.indexOf(header.toLowerCase());
                            }
                        });
                    }

                    columnIndex[mapping.key] = index;
                });

                console.log("Column Index Map:", columnIndex); // Debugging step
                if (Object.values(columnIndex).some((index) => index === -1)) {
                    console.error("Missing required columns");
                    message.error("הקובץ חייב לכלול את העמודות: שם פרטי, שם משפחה, ואימייל");
                    return;
                }

                let formattedData = [];
                const startRow = firstRow.some((h) =>
                    headerMappings.some((m) => [...m.eng, ...m.heb].includes(h.toLowerCase())),
                )
                    ? 1
                    : 0;

                jsonData.slice(startRow).forEach((row) => {
                    if (row.some((cell) => cell !== null && cell !== undefined && cell !== "")) {
                        formattedData.push({
                            first_name: row[columnIndex.firstName] || "",
                            last_name: row[columnIndex.lastName] || "",
                            email: row[columnIndex.email] || "",
                        });
                    }
                });

                // Remove duplicates and attach email to existing users
                const uniqueEmails = new Map();
                const ejectedEmails = [];

                formattedData.forEach((row) => {
                    if (row.first_name && row.last_name && row.email) {
                        const key = `${row.first_name.toLowerCase()}_${row.last_name.toLowerCase()}`;
                        if (!uniqueEmails.has(key)) {
                            uniqueEmails.set(key, row.email);
                        } else {
                            ejectedEmails.push(`${row.first_name} ${row.last_name}`);
                        }
                    }
                });

                // Attach emails to existing users
                const updatedUsers = users.map((user) => {
                    const key = `${user.first_name.toLowerCase()}_${user.last_name.toLowerCase()}`;
                    if (uniqueEmails.has(key)) {
                        return { ...user, email: uniqueEmails.get(key) };
                    }
                    return user; // Keep the user without email if no match
                });

                console.log(duplicatedUsers);
                const filteredUsers = updatedUsers.filter(
                    (user) => !duplicatedUsers.includes(`${user.first_name} ${user.last_name}`),
                );

                setStep(2);
                setUsers(filteredUsers);
                setDuplicatedUsers([...duplicatedUsers, ...ejectedEmails]);
            } catch (error) {
                console.error("Error processing email file:", error);
            }
        };

        reader.readAsArrayBuffer(file);
        return false; // Prevent default upload behavior
    };

    const handleUploadIDFile = (file) => {
        const fileType = file.name.split(".").pop().toLowerCase();

        if (!["csv", "xlsx", "xls"].includes(fileType)) {
            message.error("פורמט קובץ לא נתמך. יש להעלות קובץ CSV או Excel.");
            return false;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0]; // Get first sheet
                const sheet = workbook.Sheets[sheetName];
                let jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Read raw rows
                if (jsonData.length === 0) {
                    console.error("הקובץ לא יכול להיות ריק");
                    return;
                }

                let firstRow = jsonData[1].map((col) => (typeof col === "string" ? col.toLowerCase().trim() : ""));

                const headerMappings = [
                    {
                        eng: ["first name", "firstname"],
                        heb: ["שם פרטי"],
                        key: "firstName",
                    },
                    {
                        eng: ["last name", "lastname"],
                        heb: ["שם משפחה"],
                        key: "lastName",
                    },
                    {
                        eng: ["id"],
                        heb: ["ת.ז.", "תעודת זהות"],
                        key: "id",
                    },
                ];

                // Find column indices more robustly
                const columnIndex = headerMappings.reduce((acc, mapping) => {
                    const engIndex = mapping.eng.findIndex((header) => firstRow.includes(header.toLowerCase()));
                    const hebIndex = mapping.heb.findIndex((header) => firstRow.includes(header.toLowerCase()));

                    acc[mapping.key] =
                        engIndex !== -1
                            ? firstRow.indexOf(mapping.eng[engIndex])
                            : hebIndex !== -1
                            ? firstRow.indexOf(mapping.heb[hebIndex])
                            : -1;

                    return acc;
                }, {});
                let formattedData = [];
                const startRow = firstRow.some((h) =>
                    headerMappings.some((m) => [...m.eng, ...m.heb].includes(h.toLowerCase())),
                )
                    ? 1
                    : 0;

                jsonData.slice(startRow).forEach((row) => {
                    // Skip empty rows
                    if (row.some((cell) => cell !== null && cell !== undefined && cell !== "")) {
                        formattedData.push({
                            first_name: row[columnIndex.firstName] || "",
                            last_name: row[columnIndex.lastName] || "",
                            id: row[columnIndex.id] || "",
                        });
                    }
                });

                if (Object.values(columnIndex).some((index) => index === -1)) {
                    console.error("Missing required columns");
                    message.error("הקובץ חייב לכלול את העמודות: שם פרטי, שם משפחה, תעודת זהות");
                    return;
                }

                // Filter out rows with empty first name, last name, or id
                const uniqueData = new Map();
                const ejectedNames = [];
                formattedData.forEach((row, index) => {
                    if (index !== 0 && row.first_name !== "" && row.last_name !== "" && row.id !== "") {
                        const key = `${row.first_name.toLowerCase()}_${row.last_name.toLowerCase()}`;
                        if (!uniqueData.has(key)) {
                            uniqueData.set(key, row);
                        } else {
                            ejectedNames.push(`${row.first_name} ${row.last_name}`);
                        }
                    }
                });
                formattedData = Array.from(uniqueData.values());
                setStep(1);
                console.log(formattedData);
                setUsers(formattedData);
                setDuplicatedUsers(ejectedNames);
            } catch (error) {}
        };

        reader.readAsArrayBuffer(file);
        return false; // Prevent default upload behavior
    };

    const propsID = {
        name: "file",
        maxCount: 1,
        accept: ".csv, .xlsx, .xls",
        beforeUpload: handleUploadIDFile,
        customRequest: ({ onSuccess }) => {
            onSuccess("ok");
        },
        showUploadList: false,
    };
    const propsEMAIL = {
        name: "file",
        maxCount: 1,
        accept: ".csv, .xlsx, .xls",
        beforeUpload: handleUploadEMAILFile,
        customRequest: ({ onSuccess }) => {
            onSuccess("ok");
        },
        showUploadList: false,
    };

    return (
        <>
            <Steps className="steps-line" size="small" current={step} items={steps} />
            {/* Step 1:  */}
            {step === 0 && (
                <div className="file-uploader">
                    <Dragger className="uploader-users-csv" {...propsID}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="uploader-title">יצירת משתמשים מקובץ</p>
                        <p className="ant-upload-text">לחצו או גררו כדי להעלות קובץ</p>
                        <p className="ant-upload-hint">
                            יש להעלות קובץ אקסל יחיד עם העמודות: שם פרטי, שם משפחה, תעודת זהות
                        </p>
                    </Dragger>
                </div>
            )}
            {/* Step 2:  */}
            {step === 1 && (
                <div className="file-uploader">
                    <Dragger className="uploader-users-csv" {...propsEMAIL}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="uploader-title">יצירת משתמשים מקובץ</p>
                        <p className="ant-upload-text">לחצו או גררו כדי להעלות קובץ</p>
                        <p className="ant-upload-hint">
                            יש להעלות קובץ אקסל יחיד עם העמודות: שם פרטי, שם משפחה, תעודת זהות
                        </p>
                    </Dragger>
                </div>
            )}
            {/* Step 3:  */}
            {step === 2 && (
                <>
                    <div className="download-file">
                        <Button
                            icon={<DownloadOutlined />}
                            type="primary"
                            onClick={() => {
                                const worksheet = XLSX.utils.json_to_sheet(users);
                                const workbook = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

                                // Rename columns from English to Hebrew
                                const hebrewHeaders = {
                                    first_name: "שם פרטי",
                                    last_name: "שם משפחה",
                                    id: "תעודת זהות",
                                    email: "אימייל",
                                };

                                const range = XLSX.utils.decode_range(worksheet["!ref"]);
                                for (let C = range.s.c; C <= range.e.c; ++C) {
                                    const address = XLSX.utils.encode_col(C) + "1"; // First row
                                    if (worksheet[address]) {
                                        worksheet[address].v = hebrewHeaders[worksheet[address].v];
                                    }
                                }

                                XLSX.writeFile(workbook, "users.xlsx");
                            }}>
                            הורד קובץ אקסל
                        </Button>
                    </div>
                </>
            )}
            {users.length > 0 && (
                <div className="users-list">
                    <Table columns={columns} dataSource={users} />
                </div>
            )}

            {duplicatedUsers.length > 0 && (
                <div className="users-list">
                    <p>משתמשים שלא הוכנסו</p>
                    <Table
                        columns={[
                            {
                                title: "שם",
                                dataIndex: "name",
                                key: "name",
                            },
                        ]}
                        dataSource={duplicatedUsers.map((name) => ({ name }))}
                    />
                </div>
            )}
        </>
    );
};

export default CreateUserFile;
