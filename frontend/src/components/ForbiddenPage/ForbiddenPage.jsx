import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const ForbiddenPage = () => {
  const navigate = useNavigate();
  return (
    <div className="forbidden-page">
      <Result
        status="403"
        title="403"
        subTitle="אינך מורשה לגשת לדף זה. פנה לרכז הפרויקטים לקבלת עזרה."
        extra={
          <Button type="primary" onClick={() => navigate("/home")}>
            לעמוד הראשי
          </Button>
        }
      />
    </div>
  );
};

export default ForbiddenPage;
