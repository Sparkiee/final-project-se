import "./App.scss";

import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import Login from "./components/Login/Login";
import WrongPath from "./components/WrongPath/WrongPath";
import Dashboard from "./components/Dashboard/Dashboard";
import ManageProjects from "./components/ManageProjects/ManageProjects";
import Sidebar from "./components/Sidebar/Sidebar";
import Projects from "./components/Projects/Projects";
import Templates from "./components/Templates/Templates";
import CreateProject from "./components/CreateProject/CreateProject";
import CreateUser from "./components/CreateUser/CreateUser";
import ShowAllUsers from "./components/ShowAllUsers/ShowAllUsers";
import HeaderMenu from "./components/HeaderMenu/HeaderMenu";

function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

const MainLayout = () => {
  const location = useLocation();
  const noSidebarRoutes = ["/login", "/", "*"];
  const shouldDisplaySidebar = !noSidebarRoutes.includes(location.pathname);

  return (
    <div className="main-container">
      {/* Display the sidebar only if the route is not in noSidebarRoutes */}
      {shouldDisplaySidebar && <Sidebar />}
      {/* Render content-container only when the sidebar is visible */}
      {shouldDisplaySidebar ? (
        <div className="content-wrapper">
          <HeaderMenu />
          {/* <Header /> */}
          <div className="content-container">
            <Routes>
              {/* Protected Routes */}
              <Route path="/profile/:userId" element={<h1>Profile</h1>} />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/templates"
                element={
                  <ProtectedRoute>
                    <Templates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-project"
                element={
                  <ProtectedRoute>
                    <CreateProject />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/list-projects"
                element={
                  <ProtectedRoute>
                    <ManageProjects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-user"
                element={
                  <ProtectedRoute>
                    <CreateUser />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/display-users"
                element={
                  <ProtectedRoute>
                    <ShowAllUsers />
                  </ProtectedRoute>
                }
              />
              {/* Development route */}
              <Route path="/dev" element={<Sidebar />} />
            </Routes>
          </div>
        </div>
      ) : (
        // Render routes without the sidebar or content container
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<WrongPath />} />
        </Routes>
      )}
    </div>
  );
};

export default App;
