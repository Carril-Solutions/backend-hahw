const Zone = require("../model/zone");
const {
  validateFields,
  validateFound,
  validateId,
  alreadyFound,
} = require("../validatores/commonValidations");

exports.createZone = async (req, res) => {
  try {
    let admin = req.user?._id;
    let { zoneName, status } = req.body;
    if (!zoneName) {
      return validateFields(res);
    }
    const data = {
      zoneName,
      status,
      adminId: admin,
    };
    const zones = await Zone.create(data);
    return res
      .status(201)
      .send({ data: zones, message: "Zone created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateZone = async (req, res) => {
  try {
    const admin = req.user?._id;
    const zoneId = req.params.zoneId;
    if (!zoneId) {
      return validateId(res);
    }
    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return validateFound(res);
    }
    const { zoneName, status } = req.body;
    if (zoneName) zone.zoneName = zoneName;
    if (status !== undefined) zone.status = status;
    zone.adminId = admin;
    await zone.save();
    return res
      .status(201)
      .send({ data: zone, message: "Zone updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.getZone = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    const result = {};

    if (endIndex < (await Zone.countDocuments().exec())) {
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
              zoneName: { $regex: new RegExp(search), $options: "si" },
            },
          ],
        }
      : {};
    const zone = await Zone.find(searchQuery)
      .sort(sortOrder)
      .skip(startIndex)
      .limit(limit);
    const count = await Zone.countDocuments();
    return res
      .status(201)
      .send({
        message: "Zone fetched successfully",
        data: zone,
        totalCount: count,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.deleteZone = async (req, res) => {
  try {
    const zoneId = req.params.zoneId;
    if (!zoneId) {
      return validateId(res);
    }
    const zone = await Zone.findByIdAndDelete(zoneId);
    if (!zone) {
      return validateFound(res);
    }
    return res
      .status(201)
      .send({ data: zone, message: "Zone deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};