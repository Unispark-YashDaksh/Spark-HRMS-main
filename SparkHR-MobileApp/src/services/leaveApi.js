import api from "./api";

export const fetchLeaveBalance = async (employeeId, year) => {
  const params = year ? { year } : {};
  const res = await api.get(`/fetchLeaveBalance/${employeeId}`, { params });
  return res.data;
};

export const applyLeave = async (payload) => {
  const res = await api.post("/applyLeaveRequest", payload);
  return res.data;
};


// fetch Leave History
export const fetchLeaveHistory = async (employeeId, status) => {
  const params = { employee_id: employeeId };
  if (status) params.status = status;
  const res = await api.get("/fetchLeaveRequests", { params });
  return res.data;
};
