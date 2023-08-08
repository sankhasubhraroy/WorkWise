const {
  getFreelancers,
  getFreelancerById,
  hasAddress,
  hasSkill,
  updatePersonalDetails,
  addSkill,
  deactivateAccount,
  createWorkRequest,
  getWorkHistory,
} = require("../../controllers/freelancer");
const {
  getConversationList,
  getMessages,
  sendMessage
} = require('../../controllers/message/messageController');
const { ROLE } = require("../../helpers/constants");
const { authUser, authRole } = require("../../middlewares/auth");

const router = require("express").Router();

router.get("/", getFreelancers);

router.put("/update-personal-details", authUser, authRole(ROLE.FREELANCER), updatePersonalDetails);

router.get("/has-address", authUser, authRole(ROLE.FREELANCER), hasAddress);

router.get("/has-skill", authUser, authRole(ROLE.FREELANCER), hasSkill);

router.post("/skills", authUser, authRole(ROLE.FREELANCER), addSkill);

router.get("/message/list", authUser, authRole(ROLE.FREELANCER), getConversationList);

router.get("/message", authUser, authRole(ROLE.FREELANCER), getMessages);

router.post("/message", authUser, authRole(ROLE.FREELANCER), sendMessage);

router.get("/work-history",getWorkHistory);

router.post("/work-request", authUser, authRole(ROLE.FREELANCER), createWorkRequest);

router.get("/deactivate-account", authUser, authRole(ROLE.FREELANCER), deactivateAccount);

router.get("/:id", getFreelancerById);

module.exports = router;
