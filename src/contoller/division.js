const Division = require("../model/division");
const {
  validateFields,
  validateFound,
  validateId,
  alreadyFound,
} = require("../validatores/commonValidations");

exports.createDivision = async (req, res) => {
  try {
    const admin = req.user?._id;
    const { divisionName, status } = req.body;
    if (!divisionName) {
      return validateFields(res);
    }
    const data = {
      divisionName,
      status,
      adminId: admin,
    };
    const user = await Division.create(data);
    return res
      .status(201)
      .send({ data: user, message: "Division created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateDivision = async (req, res) => {
  try {
    const admin = req.user?._id;
    const divisionId = req.params.divisionId;
    const divison = await Division.findById(divisionId);
    if (!divison) {
      return validateFound(res);
    }
    const { divisionName, status } = req.body;
    if (divisionName) divison.divisionName = divisionName;
    if (status !== undefined) divison.status = status;
    if (admin) divison.adminId = admin;
    await divison.save();
    return res
      .status(201)
      .send({ data: divison, message: "Division updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getDivision = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    const result = {};

    if (endIndex < (await Division.countDocuments().exec())) {
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
              divisionName: { $regex: new RegExp(search), $options: "si" },
            },
          ],
        }
      : {};
    const division = await Division.find(searchQuery)
      .sort(sortOrder)
      .skip(startIndex)
      .limit(limit);
    const count = await Division.countDocuments();
    return res
      .status(200)
      .send({
        message: "Division Fetched successfully",
        data: division,
        totalCounts: count,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.deleteDivision = async (req, res) => {
  try {
    const divisionId = req.params.divisionId;
    const divison = await Division.findByIdAndDelete(divisionId);
    if (!divison) {
      return validateFound(res);
    }
    return res
      .status(201)
      .send({ data: divison, message: "Division deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};
