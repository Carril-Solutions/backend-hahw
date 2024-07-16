const IssueCode = require("../model/issueCode");
const {
  validateFields,
  validateFound,
  validateId,
  alreadyFound,
} = require("../validatores/commonValidations");

exports.addIssueCode = async (req, res) => {
  try {
    const admin = req.user?._id;
    const { componentName, issueCode, status } = req.body;
    if (!componentName || !issueCode) {
      return validateFields(res);
    }
    const data = {
      componentName,
      issueCode,
      status,
      adminId: admin,
    };
    const user = await IssueCode.create(data);
    return res
      .status(201)
      .send({ data: user, message: "IssueCode created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateIssueCode = async (req, res) => {
  try {
    const admin = req.user?._id;
    const issueCodeId = req.params.issueCodeId;
    if (!issueCodeId) {
      return validateId(res);
    }
    const code = await IssueCode.findById(issueCodeId);
    if (!code) {
      return validateFound(res);
    }
    const { componentName, issueCode, status } = req.body;
    if (componentName) code.componentName = componentName;
    if (issueCode) code.issueCode = issueCode;
    if (status !== undefined) code.status = status;
    if (admin) code.adminId = admin;
    await code.save();
    return res
      .status(201)
      .send({ data: code, message: "IssueCode updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateIssueCodeStatus = async (req, res) => {
  try {
    const issueCodeId = req.params.issueCodeId;
    if (!issueCodeId) {
      return validateId(res);
    }
    const user = await issueCodeId.findById(issueCodeId);
    if (!user) {
      return validateFound(res);
    }
    user.status = !user.status;
    await user.save();
    return res
      .status(201)
      .send({ data: user, message: "Status updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getIssueCode = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    const result = {};

    if (endIndex < (await IssueCode.countDocuments().exec())) {
      result.next = {
        page: page + 1,
        limit: limit,
      };
    }

    if (startIndex > 0) {
      result.previous = {
        page: page - 1,
        limit: limit,
      };
    }

    const order = req.query.order || "";
    const sort = req.query.sort || "";

    let sortOrder = {};
    if (order === "ascending") {
      sortOrder = { [sort]: 1 };
    } else if (order === "descending") {
      sortOrder = { [sort]: -1 };
    } else {
      sortOrder = { createdAt: -1 };
    }

    const search = req.query.search || "";

    let searchQuery = search
      ? {
          $or: [
            {
              componentName: { $regex: new RegExp(search), $options: "si" },
            },
            {
              issueCode: { $regex: new RegExp(search), $options: "si" },
            },
          ],
        }
      : {};
    const issueCode = await IssueCode.find(searchQuery)
      .sort(sortOrder)
      .skip(startIndex)
      .limit(limit);
    const count = await IssueCode.countDocuments();
    return res
      .status(200)
      .send({
        message: "IssueCodes fetched successfully",
        data: issueCode,
        totalCount: count,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.deleteIssueCode = async (req, res) => {
  try {
    const issueCodeId = req.params.issueCodeId;
    if (!issueCodeId) {
      return validateId(res);
    }
    const issueCode = await IssueCode.findByIdAndDelete(issueCodeId);
    if (!issueCode) {
      return validateFound(res);
    }
    return res
      .status(201)
      .send({ data: issueCode, message: "IssueCode deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};
