import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import ProtectedRoute from "./components/ProtectedRoute";

// Views
import OverviewView from "./views/OverviewView";
import DocumentsView from "./views/DocumentsView";
import ActivityView from "./views/ActivityView";
import AdminView from "./views/AdminView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<OverviewView />} />
            <Route path="documents" element={<DocumentsView />} />
            <Route path="activity" element={<ActivityView />} />
            <Route path="admin" element={<AdminView />} />
            <Route path="chat/:documentId" element={<Chat />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
