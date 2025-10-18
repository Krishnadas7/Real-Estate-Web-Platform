import Issue from "../models/issueModel.js";

// ✅ Create Issue
export const createIssue = async (req, res) => {
  try {
    const issue = new Issue(req.body);
    await issue.save();
    return res.status(201).json({ message: "Issue created successfully", issue });
  } catch (error) {
    return res.status(500).json({ message: "Error creating issue", error: error.message });
  }
};

// ✅ Update Issue (only selected fields)
export const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    const updatedIssue = await Issue.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updatedIssue) return res.status(404).json({ message: "Issue not found" });

    return res.json({ message: "Issue updated successfully", issue: updatedIssue });
  } catch (error) {
    return res.status(500).json({ message: "Error updating issue", error: error.message });
  }
};

// ✅ Delete Issue
export const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Issue.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Issue not found" });

    return res.json({ message: "Issue deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting issue", error: error.message });
  }
};

// ✅ Get all Issues (list with pagination)
export const listIssues = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const issues = await Issue.find()
      .populate("driver")
      .populate("vehicle")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const count = await Issue.countDocuments();

    return res.json({
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      issues,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching issues", error: error.message });
  }
};

// ✅ Search Issues (by issueType, priority, status, tags, etc.)
export const searchIssues = async (req, res) => {
  try {
    const { keyword } = req.query;
    let query = {};

    if (keyword) {
      query = {
        $or: [
          { issueType: { $regex: keyword, $options: "i" } },
          { issueCategory: { $regex: keyword, $options: "i" } },
          { issueReport: { $regex: keyword, $options: "i" } },
          { priority: { $regex: keyword, $options: "i" } },
          { status: { $regex: keyword, $options: "i" } },
          { issueTags: { $regex: keyword, $options: "i" } },
        ],
      };
    }

    const issues = await Issue.find(query).populate("driver").populate("vehicle");

    return res.json({ total: issues.length, issues });
  } catch (error) {
    return res.status(500).json({ message: "Error searching issues", error: error.message });
  }
};
