const express = require("express");
const RequestController = require("../controllers/RequestController");

const router = express.Router();

// Routes using controllers
router.get("/my-requests", RequestController.getMyRequests);
router.get("/requests/seller/:sellerId", RequestController.getSellerRequests);
router.put("/:requestId/status", RequestController.updateRequestStatus);

// API endpoints
router.get("/api/requests/my-requests", RequestController.getMyRequests);
router.get("/api/requests/seller/:sellerId", RequestController.getSellerRequests);
router.get("/api/requests/buyer", RequestController.getBuyerRequests);
router.get("/api/requests/:requestId", RequestController.getRequestById);
router.put("/api/requests/:requestId/status", RequestController.updateRequestStatus);
router.delete("/api/requests/:requestId", RequestController.cancelRequest);
router.get("/api/requests/stats", RequestController.getRequestStats);

module.exports = router;