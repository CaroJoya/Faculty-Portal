import { Navigate } from "react-router-dom";

function homeByRole(role) {
  if (role === "hod") return "/hod-dashboard";
  if (role === "registry") return "/registry-dashboard";
  if (role === "officestaff") return "/officestaff-dashboard";
  if (role === "headclerk") return "/headclerk-dashboard";
  if (role === "principal") return "/principal-dashboard";
  return "/dashboard";
}

export default function RoleRoute({ allowedRoles = [], children }) {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  if (!token) return <Navigate to="/login" replace />;

  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch {
    user = null;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={homeByRole(user?.role)} replace />;
  }

  return children;
}