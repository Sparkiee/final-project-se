import React, { useEffect, useState, useContext } from "react";
import "./CheckSubmissions.scss";
import axios from "axios";
import { Tooltip, List, Skeleton, Modal, Tabs } from "antd";
import { useNavigate } from "react-router-dom";
import { handleMouseDown } from "../../utils/mouseDown";
import { DownloadOutlined } from "@ant-design/icons";
import { downloadFile } from "../../utils/downloadFile";
import { NotificationsContext } from "../../utils/NotificationsContext";

const CheckSubmissions = () => {
  const navigate = useNavigate();
  const { fetchNotifications } = useContext(NotificationsContext);
  const [initLoading, setInitLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [moreDetailsModal, setMoreDetailsModal] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState({});
  const [fileListModal, setFileListModal] = useState(false);
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
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/submission/get-judge-submissions`, {
          withCredentials: true,
        });
        setSubmissions(response.data);
        setInitLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
    fetchNotifications();
  }, []);

  const getSumbissionDetails = async (submissionId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/get-submission-details/${submissionId}`,
        {
          withCredentials: true,
        }
      );
      setSubmissionDetails(response.data);
      setMoreDetailsModal(true);
    } catch (error) {
      console.error(error);
      setSubmissionDetails({});
      setMoreDetailsModal(false);
    }
  };
  const waitingForGrade = submissions.filter(
    (submission) =>
      new Date(submission.submissionDate) < new Date() &&
      (submission.submitted || !submission.fileNeeded) &&
      submission.grade === null &&
      submission.videoQuality === null &&
      (submission.isReviewed || submission.isGraded)
  );
  const gradedAndEditable = submissions
    .filter((submission) => (submission.grade !== null || submission.videoQuality !== null) && submission.editable)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const gradedSubmissions = submissions
    .filter((submission) => (submission.grade !== null || submission.videoQuality !== null) && !submission.editable)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const renderSubmissionDetails = (item) => {
    if (item.isReviewed && !item.isGraded) {
      return (
        <>
          {item.videoQuality ? (
            <span>ניתן משוב</span>
          ) : (
            <span>
              <strong>לא ניתן משוב</strong>
            </span>
          )}
          {item.fileNeeded && (
            <Tooltip title="הורד קובץ">
              <DownloadOutlined
                className="icon"
                onClick={() =>
                  item.gotExtraUpload
                    ? (setFileListModal(true), setSubmissionDetails(item))
                    : downloadFile(item.file._id, "submissions")
                }
              />
            </Tooltip>
          )}
        </>
      );
    } else if (!item.isReviewed && !item.isGraded) {
      return <span>הגשה זאת היא ללא שפיטה</span>;
    } else {
      return (
        <>
          <div className="grade">
            {item.grade ? (
              <span>ציון: </span>
            ) : (
              <span>
                <strong>לא ניתן ציון</strong>
              </span>
            )}
            <p>{item.grade}</p>
          </div>
          {item.fileNeeded && (
            <Tooltip title="הורד קובץ">
              <DownloadOutlined
                className="icon"
                onClick={() =>
                  item.gotExtraUpload
                    ? (setFileListModal(true), setSubmissionDetails(item))
                    : downloadFile(item.file._id, "submissions")
                }
              />
            </Tooltip>
          )}
        </>
      );
    }
  };

  const items = [
    {
      key: "1",
      label: "מחכה לשפיטה",
      children: (
        <List
          className="submission-list"
          loading={initLoading}
          itemLayout="horizontal"
          pagination={{
            pageSize: 10,
          }}
          dataSource={waitingForGrade}
          renderItem={(item) => (
            <List.Item
              actions={
                !item.isReviewed && !item.isGraded
                  ? []
                  : [
                      windowSize.width <= 626 && (
                        <div className="submission-details">{renderSubmissionDetails(item)}</div>
                      ),
                      <a
                        key="list-grade"
                        onClick={() => navigate(`/grade-submission/${item.key}`)}
                        onMouseDown={(e) => handleMouseDown(e, `/grade-submission/${item.key}`)}>
                        שפיטה
                      </a>,
                    ]
              }>
              <Skeleton title={false} loading={item.loading} active>
                <List.Item.Meta
                  className="submission-meta"
                  title={
                    <div className="project-name">
                      <span>
                        {item.submissionName} - (
                        <a
                          onClick={() => navigate(`/project/${item.projectId}`)}
                          onMouseDown={(e) => handleMouseDown(e, `/project/${item.projectId}`)}>
                          {windowSize.width > 1200
                            ? item.projectName.length > 55
                              ? item.projectName.slice(0, 55) + "..."
                              : item.projectName
                            : windowSize.width > 626
                            ? item.projectName.length > 40
                              ? item.projectName.slice(0, 40) + "..."
                              : item.projectName
                            : item.projectName.length > 45
                            ? item.projectName.slice(0, 45) + "..."
                            : item.projectName}
                        </a>
                        )
                      </span>
                    </div>
                  }
                  description={
                    item.gotExtraUpload ? "2 קבצים מצורפים" : item.file?.filename ? item.file.filename : "הגשה ללא קובץ"
                  }
                />
                {windowSize.width > 626 && <div className="submission-details">{renderSubmissionDetails(item)}</div>}
              </Skeleton>
            </List.Item>
          )}
        />
      ),
    },
    {
      key: "2",
      label: "ניתנים לשינוי",
      children: (
        <List
          className="submission-list"
          loading={initLoading}
          itemLayout="horizontal"
          pagination={{
            pageSize: 10,
          }}
          dataSource={gradedAndEditable}
          renderItem={(item) => (
            <List.Item
              actions={[
                <a
                  key="list-grade"
                  onClick={() => navigate(`/grade-submission/${item.key}?edit=true`)}
                  onMouseDown={(e) => handleMouseDown(e, `/grade-submission/${item.key}?edit=true`)}>
                  עריכה
                </a>,
                <a
                  key="list-more"
                  onClick={() => {
                    getSumbissionDetails(item.key);
                  }}>
                  פרטים נוספים
                </a>,
              ]}>
              <Skeleton title={false} loading={item.loading} active>
                <List.Item.Meta
                  className="submission-meta"
                  title={
                    <div className="project-name">
                      <span>
                        {item.submissionName} - (
                        <a
                          onClick={() => navigate(`/project/${item.projectId}`)}
                          onMouseDown={(e) => handleMouseDown(e, `/project/${item.projectId}`)}>
                          {windowSize.width > 1200
                            ? item.projectName.length > 55
                              ? item.projectName.slice(0, 55) + "..."
                              : item.projectName
                            : windowSize.width > 626
                            ? item.projectName.length > 40
                              ? item.projectName.slice(0, 40) + "..."
                              : item.projectName
                            : item.projectName.length > 45
                            ? item.projectName.slice(0, 45) + "..."
                            : item.projectName}
                        </a>
                        )
                      </span>
                    </div>
                  }
                  description={
                    item.gotExtraUpload ? "2 קבצים מצורפים" : item.file?.filename ? item.file.filename : "הגשה ללא קובץ"
                  }
                />
                <div className="submission-details">{renderSubmissionDetails(item)}</div>
              </Skeleton>
            </List.Item>
          )}
        />
      ),
    },
    {
      key: "3",
      label: "נשפט",
      children: (
        <List
          className="submission-list"
          loading={initLoading}
          itemLayout="horizontal"
          pagination={{
            pageSize: 10,
          }}
          dataSource={gradedSubmissions}
          renderItem={(item) => (
            <List.Item
              actions={[
                <a
                  key="list-more"
                  onClick={() => {
                    getSumbissionDetails(item.key);
                  }}>
                  פרטים נוספים
                </a>,
              ]}>
              <Skeleton title={false} loading={item.loading} active>
                <List.Item.Meta
                  className="submission-meta"
                  title={
                    <div className="project-name">
                      <span>
                        {item.submissionName} - (
                        <a
                          onClick={() => navigate(`/project/${item.projectId}`)}
                          onMouseDown={(e) => handleMouseDown(e, `/project/${item.projectId}`)}>
                          {windowSize.width > 1200
                            ? item.projectName.length > 55
                              ? item.projectName.slice(0, 55) + "..."
                              : item.projectName
                            : windowSize.width > 626
                            ? item.projectName.length > 40
                              ? item.projectName.slice(0, 40) + "..."
                              : item.projectName
                            : item.projectName.length > 45
                            ? item.projectName.slice(0, 45) + "..."
                            : item.projectName}
                        </a>
                        )
                      </span>
                    </div>
                  }
                  description={
                    item.gotExtraUpload ? "2 קבצים מצורפים" : item.file?.filename ? item.file.filename : "הגשה ללא קובץ"
                  }
                />
                <div className="submission-details">{renderSubmissionDetails(item)}</div>
              </Skeleton>
            </List.Item>
          )}
        />
      ),
    },
  ];

  return (
    <div className="check-submissions-container">
      <Tabs defaultActiveKey="1" items={items} />
      <Modal
        title="רשימת קבצים"
        open={fileListModal}
        onCancel={() => {
          setFileListModal(false);
          setSubmissionDetails({});
        }}
        cancelText="סגור"
        okButtonProps={{ style: { display: "none" } }}>
        <ul>
          {submissionDetails.file && (
            <li>
              <a onClick={() => downloadFile(submissionDetails.file._id, "submissions")}>
                {submissionDetails.file.filename}
              </a>
            </li>
          )}
          {submissionDetails.extraUploadFile && (
            <li>
              <a onClick={() => downloadFile(submissionDetails.extraUploadFile._id, "submissions")}>
                {submissionDetails.extraUploadFile.filename}
              </a>
            </li>
          )}
        </ul>
      </Modal>
      <Modal
        title="פרטי שפיטה"
        open={moreDetailsModal}
        onCancel={() => {
          setMoreDetailsModal(false);
          setSubmissionDetails({});
        }}
        cancelText="סגור"
        okButtonProps={{ style: { display: "none" } }}>
        <div className="details-title">
          <h3>{submissionDetails.projectName}</h3>
          <p>הגשה - {submissionDetails.submissionName}</p>
        </div>
        <div className="details-grade">
          {submissionDetails.isGraded && (
            <>
              <span>ציון שניתן על ידך:</span>{" "}
              <p>{submissionDetails.grade ? submissionDetails.grade : "לא ניתן ציון"}</p>
            </>
          )}
        </div>
        {submissionDetails.isReviewed && (
          <>
            <p>
              <strong>איכות הוידאו:</strong> {submissionDetails.videoQuality}
            </p>
            <p>
              <strong>איכות העבודה:</strong> {submissionDetails.workQuality}
            </p>
            <p>
              <strong>איכות הכתיבה:</strong> {submissionDetails.writingQuality}
            </p>
            {submissionDetails.commits && (
              <p>
                <strong>מספר הקומיטים:</strong> {submissionDetails.commits}
              </p>
            )}
            {submissionDetails.journalActive && (
              <p>
                <strong>האם היומן פעיל:</strong>{" "}
                {submissionDetails.journalActive === "yes"
                  ? "כן"
                  : submissionDetails.journalActive === "no"
                  ? "לא"
                  : ""}
              </p>
            )}
          </>
        )}
        <p>
          <strong>תאריך שפיטה:</strong>{" "}
          {new Date(submissionDetails.updatedAt).toLocaleString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </p>
      </Modal>
    </div>
  );
};

export default CheckSubmissions;
