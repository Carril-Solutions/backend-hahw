const validateFields = (res) => {
    return res.status(400).send({ error: " Mendatory Fields are required" });
};
const validateFound = (res) => {
    return res.status(400).send({ error: "not found" });
};
const validateId = (res) => {
    return res.status(400).send({ error: "Id is required" });
};

const alreadyFound = (res) => {
    return res.status(400).send({ error: "already found" });
};

module.exports = {
  validateFields, validateFound, validateId, alreadyFound
};
