const Role = require('../model/role'); 
const User = require('../model/userModel');

exports.checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
      try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate({
            path: "role",
            model: "role",
            select: "_id role",
          });
        if (!user || !user.role) {
          return res.status(403).send({ error: "Access denied: User role not found" });
        }
  
        const role = await Role.findById(user.role).populate({
            path: "permission",
            model: "permission",
            select: "_id permissionName",
          });
        const permissions = role.permission.map(perm => perm.permissionName);
  
        if (!permissions.includes(requiredPermission)) {
          return res.status(403).send({ error: "Access denied: Insufficient permissions" });
        }
  
        next();
      } catch (error) {
        console.log(error);
        return res.status(500).send({ error: "Internal server error" });
      }
    };
  };