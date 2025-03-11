import React, { useState, useEffect } from "react";
import axios from "axios";
import { Tabs, Select, Table, Row, Col, Input, Radio, message } from "antd";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import "./GradeDistribution.scss";

const GradeDistribution = () => {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("pick_year");
  const [selectedSubmission, setSelectedSubmission] = useState("pick_submission");
  const [selectedJudge, setSelectedJudge] = useState("pick_judge");
  const [calculationMethod, setCalculationMethod] = useState("average");

  const [judges, setJudges] = useState([]);
  const [submissionOptions, setSubmissionOptions] = useState([]);

  const [data, setData] = useState([]);
  const [adjustedData, setAdjustedData] = useState([]);

  const [judgeData, setJudgeData] = useState([]);

  // global
  const [average, setAverage] = useState(0);
  const [median, setMedian] = useState(0);
  const [letters, setLetters] = useState({
    "A+": 0,
    A: 0,
    "A-": 0,
    "B+": 0,
    B: 0,
    "B-": 0,
    "C+": 0,
    C: 0,
    "C-": 0,
    "D+": 0,
    D: 0,
    "D-": 0,
    E: 0,
    F: 0,
  });

  const personSVG = (
    <svg width="64" height="64" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 15.503A5.041 5.041 0 1 0 16 5.42a5.041 5.041 0 0 0 0 10.083zm0 2.215c-6.703 0-11 3.699-11 5.5v3.363h22v-3.363c0-2.178-4.068-5.5-11-5.5z" />
    </svg>
  );

  const fetchYear = async () => {
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/config/get/year`, {
      withCredentials: true,
    });
    setYears(response.data.years.sort((a, b) => b.localeCompare(a)));
  };

  const fetchJudges = async (year) => {
    setJudges([]);
    if (!year || year === "pick_year") return;
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/get-active-advisors/`, {
      params: { year: year },
      withCredentials: true,
    });
    setJudges(response.data);
  };

  const fetchSubmissions = async (year) => {
    if (!year || year === "pick_year") return;
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/submission/get-yearly-submissions`, {
      params: { year: year },
      withCredentials: true,
    });
    setSubmissionOptions(response.data);
  };

  const pickSubmissionDistribution = async (value) => {
    setData([]);
    setAdjustedData([]);
    if (!submissionOptions.includes(value)) return; // invalid submission option
    if (selectedYear === "pick_year") return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/get-distribution-submission`,
        {
          params: { year: selectedYear, submission: value },
          withCredentials: true,
        }
      );
      setData(response.data);
      adjustData(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getAdvisorSubmissions = async (value) => {
    if (!judges.map((advisor) => advisor._id).includes(value)) return;
    if (selectedYear === "pick_year") return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/get-judge-submission-names`,
        {
          params: { year: selectedYear, judge: value },
          withCredentials: true,
        }
      );
      setSubmissionOptions(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const pickJudgeDistribution = async (submission, judge = selectedJudge) => {
    if (!judges.map((judge) => judge._id).includes(judge)) return;
    if (selectedYear === "pick_year") return;
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/submission/get-distribution-judge`, {
        params: { year: selectedYear, submission: submission, judge: judge },
        withCredentials: true,
      });
      setJudgeData(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const adjustData = (data) => {
    if (data.length === 0) return;

    const newData = data.map((entry) => {
      let gradesArray = entry.grades.map((grade) =>
        grade.numericGrade !== null ? grade.numericGrade : parseInt(letters[grade.grade], 10)
      );

      let newValue;
      if (calculationMethod === "average") {
        newValue = gradesArray.reduce((sum, num) => sum + num, 0) / gradesArray.length;
      } else if (calculationMethod === "median") {
        gradesArray.sort((a, b) => a - b);
        const mid = Math.floor(gradesArray.length / 2);
        newValue = gradesArray.length % 2 === 0 ? (gradesArray[mid - 1] + gradesArray[mid]) / 2 : gradesArray[mid];
      }

      return { ...entry, value: Math.floor(newValue) }; // Preserve original object, only updating 'value'
    });

    setAdjustedData(newData); // Update state with new, non-mutated data
  };

  useEffect(() => {
    fetchYear();
  }, []);

  useEffect(() => {
    if (adjustedData.length === 0) return;
    let average = 0;
    adjustedData.forEach((entry) => {
      average += entry.value;
    });
    average /= adjustedData.length;
    setAverage(Math.floor(average));

    let median;
    const sortedGrades = adjustedData.map((entry) => entry.value).sort((a, b) => a - b);
    const mid = Math.floor(sortedGrades.length / 2);
    median = sortedGrades.length % 2 === 0 ? (sortedGrades[mid - 1] + sortedGrades[mid]) / 2 : sortedGrades[mid]; // Calculate median
    setMedian(median);
  }, [adjustedData]);

  useEffect(() => {
    adjustData(data);
  }, [letters, data, calculationMethod]);

  const handleInputChange = (grade, newValue) => {
    if (newValue < 0 || newValue > 100) return; // Invalid input
    setLetters((prevLetters) => ({
      ...prevLetters,
      [grade]: newValue, // Update the specific grade with new value
    }));
  };

  const columns = [
    {
      title: "ציון",
      dataIndex: "grade",
      key: "grade",
    },
    {
      title: "ערך",
      dataIndex: "value",
      key: "value",
      render: (text, record) => (
        <Input
          type="number"
          value={record.value}
          onChange={(e) => {
            handleInputChange(record.grade, e.target.value);
          }}
        />
      ),
    },
  ];

  const aggregateJudgeData = (data) => {
    const aggregated = {
      "A+": { grade: "A+", count: 0, self: 0 },
      A: { grade: "A", count: 0, self: 0 },
      "A-": { grade: "A-", count: 0, self: 0 },
      "B+": { grade: "B+", count: 0, self: 0 },
      B: { grade: "B", count: 0, self: 0 },
      "B-": { grade: "B-", count: 0, self: 0 },
      "C+": { grade: "C+", count: 0, self: 0 },
      C: { grade: "C", count: 0, self: 0 },
      "C-": { grade: "C-", count: 0, self: 0 },
      "D+": { grade: "D+", count: 0, self: 0 },
      D: { grade: "D", count: 0, self: 0 },
      "D-": { grade: "D-", count: 0, self: 0 },
      E: { grade: "E", count: 0, self: 0 },
      F: { grade: "F", count: 0, self: 0 },
    };

    data.forEach((entry) => {
      const grade = entry.grade; // Use computed value as the key
      if (!aggregated[grade]) {
        aggregated[grade] = { grade, count: 0, self: 0 };
      }
      if (entry.isOwnProject) aggregated[grade].self += 1; // Count selfoccurrences
      else aggregated[grade].count += 1; // Count occurrences
    });
    return Object.values(aggregated).sort((a, b) => b.grade - a.grade); // Reverse the sorted array
  };

  const aggregateData = (data) => {
    const aggregated = {};
    data.forEach((entry) => {
      const grade = entry.value; // Use computed value as the key
      if (!aggregated[grade]) {
        aggregated[grade] = { grade, count: 0 };
      }
      aggregated[grade].count += 1; // Count occurrences
    });

    const sortedGrades = Object.values(aggregated).sort((a, b) => a.grade - b.grade); // Sort by grade
    for (let i = sortedGrades[0].grade; i <= sortedGrades[sortedGrades.length - 1].grade; i++) {
      if (!aggregated[i]) {
        aggregated[i] = { grade: i, count: 0 };
      }
    }
    return Object.values(aggregated).sort((a, b) => a.grade - b.grade);
  };

  const letterTableRender = () => {
    // Split the letters data into two parts
    const dataEntries = Object.entries(letters).map(([grade, value]) => ({
      key: grade,
      grade,
      value,
    }));
    const half = Math.ceil(dataEntries.length / 2);
    const firstHalf = dataEntries.slice(0, half);
    const secondHalf = dataEntries.slice(half);

    return (
      <>
        <Row gutter={16}>
          <Col span={12}>
            <Table dataSource={firstHalf} columns={columns} pagination={false} bordered />
          </Col>
          <Col span={12}>
            <Table dataSource={secondHalf} columns={columns} pagination={false} bordered />
          </Col>
        </Row>
        <div className="grade-warning">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24">
            <path
              d="M29.879 27.345c-.068-.107-.117-.227-.18-.336-.094-.164-.193-.326-.287-.49-.201-.354-.389-.713-.582-1.07-.398-.732-.836-1.439-1.219-2.182-.387-.754-.768-1.512-1.15-2.268-.398-.785-.85-1.541-1.281-2.311-.443-.789-.832-1.609-1.252-2.412-.408-.781-.818-1.564-1.219-2.35-.414-.812-.836-1.621-1.258-2.428-.432-.818-.877-1.629-1.291-2.459-.406-.816-.826-1.627-1.24-2.439a42.11 42.11 0 0 0-1.496-2.705.893.893 0 0 0-.696-.427.883.883 0 0 0-.255-.041.889.889 0 0 0-.229.03c-.23.064-.385.207-.518.398-.287.412-.561.83-.826 1.258-.217.35-.416.713-.641 1.057-.459.701-.977 1.361-1.391 2.092-.432.756-.885 1.5-1.328 2.25-.432.732-.816 1.49-1.238 2.229-.422.744-.875 1.471-1.311 2.207-.434.732-.822 1.488-1.25 2.225-.42.727-.836 1.457-1.268 2.176-.439.729-.844 1.475-1.27 2.213-.514.893-1.004 1.799-1.564 2.664-.254.395-.512.783-.758 1.182-.248.4-.498.803-.762 1.193-.162.24-.137.541-.012.791-.02.072-.043.143-.043.219 0 .215.086.424.238.576.162.162.352.217.576.238.848.076 1.701.064 2.553.08.867.014 1.734.004 2.602.016.818.01 1.637.021 2.457.027.842.004 1.684.041 2.525.031.842-.012 1.684-.045 2.525-.035.447.004.895.014 1.34.043.418.027.834.076 1.254.098.814.041 1.627.029 2.443.039.844.01 1.684.027 2.527.074.98.053 1.959.129 2.941.164.461.018.922.023 1.385.031.422.008.842.016 1.262-.018.23-.02.43-.08.598-.248.033-.033.05-.078.076-.115.065-.019.131-.029.193-.066.408-.236.572-.795.32-1.201zm-3.451-.069c-.812-.02-1.627-.09-2.441-.129-.404-.021-.811-.059-1.217-.072-.404-.014-.809-.021-1.215-.033-.844-.023-1.688-.031-2.533-.037-.848-.006-1.691-.098-2.537-.125a34.795 34.795 0 0 0-2.502.027c-.852.033-1.701.027-2.553.021a89.26 89.26 0 0 0-2.535.01c-1 .016-1.998.035-2.996.012a55.535 55.535 0 0 1-1.955-.08c.281-.451.56-.904.848-1.352.465-.723.881-1.469 1.287-2.225.801-1.486 1.672-2.934 2.52-4.393.439-.756.896-1.5 1.326-2.264.402-.711.85-1.396 1.273-2.094.443-.73.848-1.479 1.27-2.221.43-.758.883-1.504 1.33-2.252.256-.428.502-.861.748-1.295.254-.449.566-.865.859-1.291.275-.4.531-.814.791-1.225.096-.151.202-.296.3-.446.31.527.627 1.051.922 1.586.426.773.799 1.574 1.18 2.367.385.803.816 1.582 1.238 2.365.432.801.838 1.617 1.27 2.42.854 1.592 1.646 3.217 2.496 4.812.408.766.854 1.512 1.26 2.279.404.766.803 1.535 1.195 2.307.393.768.84 1.504 1.258 2.256.198.356.383.717.574 1.074-.487.005-.973.008-1.461-.002zm-9.46-8.758c.021.545.064 1.088.066 1.633a.846.846 0 0 1-.838.838c-.471 0-.818-.381-.838-.838-.021-.553-.035-1.105-.049-1.658a27.37 27.37 0 0 1-.006-1.695c.021-.555.055-1.109.07-1.666.016-.623.014-1.246.02-1.869a.777.777 0 0 1 .768-.766c.41 0 .773.348.766.766-.023 1.189-.057 2.377-.014 3.566.02.563.033 1.127.055 1.689zm.001 5.235c0 .451-.377.828-.828.828s-.828-.377-.828-.828.377-.828.828-.828.828.377.828.828z"
              fill="red"
            />
          </svg>
          <span>לאחר פרסום הציון, הערך של האותיות נלקח אוטומטית כערך החישוב ולא מחושב מחדש לפי טבלה זו.</span>
        </div>
      </>
    );
  };

  const items = [
    {
      key: "1",
      label: "התפלגות ציונים לפי הגשה",
      children: (
        <>
          <div className="select-options">
            <Select
              value={selectedYear}
              style={{ width: 200 }}
              options={[
                { value: "pick_year", label: "בחירת שנה" },
                ...years.map((year) => ({
                  value: year,
                  label: year,
                })),
              ]}
              onChange={(value) => {
                setSelectedYear(value);
                setSubmissionOptions([]);
                fetchSubmissions(value);
                setSelectedSubmission("pick_submission");
                setData([]);
                setAdjustedData([]);
              }}
            />
            <Select
              value={selectedSubmission}
              style={{ width: 200 }}
              options={[
                { value: "pick_submission", label: "בחר הגשה" },
                ...submissionOptions.map((submission) => ({
                  value: submission,
                  label: submission,
                })),
              ]}
              onChange={(value) => {
                setSelectedSubmission(value);
                pickSubmissionDistribution(value);
              }}
              styles={{
                control: (provided) => ({
                  ...provided,
                  width: "auto",
                  minWidth: "150px",
                }),
              }}
            />
          </div>
          <div className="tab-content">
            <div className="graph-zone">
              {/* {adjustedData.length === 0 && <h2>אין נתונים להצגה</h2>} */}
              {adjustedData.length > 0 && (
                <ResponsiveContainer width="100%" height={700}>
                  <h2 className="graph-title">התפלגות ציונים לפי הגשה</h2>
                  <BarChart
                    data={aggregateData(adjustedData)}
                    margin={{ top: 50, right: 50, left: 50, bottom: 50 }} // Increased top margin for labels
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis dx={-30} allowDecimals={false} />
                    <Tooltip />
                    {/* <Legend
                                            formatter={(value) => <span style={{ marginRight: 10 }}>{value}</span>}
                                        /> */}
                    <Legend
                      formatter={(value, entry) => (
                        <span
                          style={{
                            color: entry.color.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, "rgb($1,$2,$3)"),
                            marginRight: 10,
                          }}>
                          {value}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="count"
                      fill="rgba(54, 162, 235, 0.3)"
                      name="מספר ציונים"
                      barSize={100} // Set the width of each bar to make it more square-like
                      barCategoryGap="10%"
                    />
                    {median !== average ? (
                      <>
                        <ReferenceLine
                          x={average}
                          stroke="darkgreen"
                          label={{
                            value: "ממוצע ציונים",
                            position: "insideTopRight",
                            dx: 20,
                            style: {
                              fontSize: 16,
                              fontWeight: "bold",
                            },
                            fill: "darkgreen",
                          }}
                          strokeDasharray="3 3"
                        />
                        <ReferenceLine
                          x={median}
                          stroke="blue"
                          label={{
                            value: "חציון ציונים",
                            position: "insideBottomLeft",
                            dx: -20,
                            style: {
                              fontSize: 16,
                              fontWeight: "bold",
                            },
                            fill: "blue",
                          }}
                          strokeDasharray="3 3"
                        />
                      </>
                    ) : (
                      <ReferenceLine
                        x={average}
                        stroke="red"
                        label={{
                          value: "חציון וממוצע ציונים",
                          position: "insideTopRight",
                          dx: -20,
                          style: {
                            fontSize: 16,
                            fontWeight: "bold",
                          },
                          fill: "red",
                        }}
                        strokeDasharray="3 3"
                      />
                    )}
                    {adjustedData.map((_, index) => (
                      <ReferenceLine key={index} y={index + 1} stroke="#ccc" />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grading-table">
              <div className="calc-type">
                <span className="calc-type-label">שיטת חישוב ציונים:</span>
                <Radio.Group
                  defaultValue={"average"}
                  options={[
                    {
                      value: "average",
                      label: "ממוצע",
                    },
                    {
                      value: "median",
                      label: "חציון",
                    },
                  ]}
                  onChange={(e) => setCalculationMethod(e.target.value)}
                />
              </div>
              {letterTableRender()}
            </div>
          </div>
        </>
      ),
    },
    {
      key: "2",
      label: "התפלגות ציונים לפי שופט",
      children: (
        <>
          <div className="select-options">
            <Select
              value={selectedYear}
              style={{ width: 200 }}
              options={[
                { value: "pick_year", label: "בחירת שנה" },
                ...years.map((year) => ({
                  value: year,
                  label: year,
                })),
              ]}
              onChange={(value) => {
                setSelectedYear(value);
                fetchJudges(value);
                setSelectedJudge("pick_judge");
                setSelectedSubmission("pick_submission");
                setJudges([]);
                setSubmissionOptions([]);
                setJudgeData([]);
              }}
            />
            <Select
              showSearch
              filterOption={(input, option) => option?.label.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              value={selectedJudge}
              style={{ width: 200 }}
              options={[
                { value: "pick_judge", label: "בחר שופט" },
                ...judges.map((advisor) => ({
                  value: advisor._id,
                  label: advisor.name,
                })),
              ]}
              onChange={(value) => {
                if (selectedYear === "pick_year" || !selectedYear) return message.error("נא לבחור שנה");
                setSelectedJudge(value);
                if (value === "pick_judge") {
                  setSelectedSubmission("pick_submission");
                  setJudgeData([]);
                  return;
                }
                getAdvisorSubmissions(value);
                if (selectedSubmission !== "pick_submission") pickJudgeDistribution(selectedSubmission, value);
              }}
            />
            <Select
              value={selectedSubmission}
              style={{ width: 200 }}
              options={[
                { value: "pick_submission", label: "בחר הגשה" },
                ...submissionOptions.map((submission) => ({
                  value: submission,
                  label: submission,
                })),
              ]}
              onChange={(value) => {
                setSelectedSubmission(value);
                pickJudgeDistribution(value);
              }}
            />
          </div>
          <div className="tab-content">
            <div className="graph-zone">
              {judgeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={700}>
                  <h2 className="graph-title">התפלגות ציונים לפי שופט</h2>
                  {selectedJudge && (
                    <h3 className="judge-info">
                      {personSVG}

                      <span>{judges.filter((j) => j._id === selectedJudge).map((j) => j.name)}</span>
                    </h3>
                  )}
                  <BarChart data={aggregateJudgeData(judgeData)} margin={{ top: 50, right: 50, left: 50, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" reversed />
                    <YAxis dx={-30} allowDecimals={false} />
                    <Tooltip />
                    {/* <Legend
                                            formatter={(value) => <span style={{ marginRight: 10 }}>{value}</span>}
                                        /> */}
                    <Legend
                      formatter={(value, entry) => (
                        <span
                          style={{
                            color: entry.color.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, "rgb($1,$2,$3)"),
                            marginRight: 10,
                          }}>
                          {value}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="self"
                      fill="rgba(54, 162, 235, 0.3)"
                      // fill="#3A7D44"
                      name="פרויקטים בהנחיה"
                      barSize={100}
                      stackId="a" // Add this stackId property
                    />
                    <Bar
                      dataKey="count"
                      fill="rgba(153, 102, 255, 0.3)"
                      // fill="#690B22"
                      name="פרויקטים בהנחיה אחרת"
                      barSize={100}
                      stackId="a" // Add this stackId with the same value
                    />
                    {judgeData.map((_, index) => (
                      <ReferenceLine key={index} y={index + 1} stroke="#ccc" />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <h3>אין התפלגות זמינה עבור משוב זה</h3>
              )}
            </div>
            {/* <div className="grading-table">{letterTableRender()}</div> */}
          </div>
        </>
      ),
    },
  ];
  return (
    <div>
      <Tabs
        defaultActiveKey="1"
        items={items}
        onChange={() => {
          setSelectedJudge("pick_judge");
          setSelectedSubmission("pick_submission");
          setSelectedYear("pick_year");
          setJudges([]);
          setData([]);
          setAdjustedData([]);
          setSubmissionOptions([]);
          setJudgeData([]);
        }}
      />
    </div>
  );
};

export default GradeDistribution;
