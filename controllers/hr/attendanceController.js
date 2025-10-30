import { Attendance } from "../../models/hr/attendanceModel.js";
import { User } from "../../models/driver/userModel.js";

const toStartOfDay = (d) => new Date(new Date(d).setHours(0,0,0,0));

export const listAttendance = async (req, res) => {
  try {
    const { month, year, employee } = req.query;
    const filter = { company: req.user.company };
    if (employee) filter.employee = employee;
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }
    const data = await Attendance.find(filter)
      .populate("employee", "name email role")
      .sort({ date: -1 })
      .lean();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const upsertAttendance = async (req, res) => {
  try {
    const { employee, date, checkIn, checkOut, status = "present", notes } = req.body;
    const emp = await User.findById(employee);
    if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });
    const d = toStartOfDay(date || new Date());
    let totalHours = 0;
    if (checkIn && checkOut) {
      const [ih, im] = checkIn.split(":").map(Number);
      const [oh, om] = checkOut.split(":").map(Number);
      totalHours = Math.max(0, ((oh * 60 + om) - (ih * 60 + im)) / 60);
    }
    const updated = await Attendance.findOneAndUpdate(
      { company: req.user.company, employee, date: d },
      { checkIn, checkOut, status, totalHours, notes },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    await Attendance.findOneAndDelete({ _id: id, company: req.user.company });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};


