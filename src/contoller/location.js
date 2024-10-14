const Location = require("../model/location");
const {
  validateFields,
  validateFound,
  validateId,
  alreadyFound,
} = require("../validatores/commonValidations");

exports.createLocation = async (req, res) => {
  try {
    const admin = req.user?._id;
    const { locationName, status } = req.body;
    if (!locationName) {
      return validateFields(res);
    }
    const data = {
      locationName,
      status,
      adminId: admin,
    };
    const location = await Location.create(data);
    return res
      .status(201)
      .send({ data: location, message: "Location created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const admin = req.user?._id;
    const locationId = req.params.locationId;
    if (!locationId) {
      return validateId(res);
    }
    const location = await Location.findById(locationId);
    if (!location) {
      return validateFound(res);
    }
    const { locationName, status } = req.body;
    if (locationName) location.locationName = locationName;
    if (status !== undefined) location.status = status;
    if (admin) location.adminId = admin;
    await location.save();
    return res
      .status(200)
      .send({ data: location, message: "Location updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.updateLocationStatus = async (req, res) => {
  try {
    const locationId = req.params.locationId;
    if (!locationId) {
      return validateId(res);
    }
    const user = await Location.findById(locationId);
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

exports.getLocation = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    const result = {};

    if (endIndex < (await Location.countDocuments().exec())) {
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
              locationName: { $regex: new RegExp(search), $options: "si" },
            },
          ],
        }
      : {};
    const location = await Location.find(searchQuery)
      .sort(sortOrder)
      .skip(startIndex)
      .limit(limit);
    const count = await Location.countDocuments();
    return res.status(200).send({
      message: "Location fetched successfully",
      data: location,
      totalCounts: count,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const locationId = req.params.locationId;
    if (!locationId) {
      return validateId(res);
    }
    const location = await Location.findByIdAndDelete(locationId);
    return res
      .status(201)
      .send({ data: location, message: "Location deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Something broke" });
  }
};
