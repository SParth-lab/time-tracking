const express = require('express');
const {
  getSalaryReport,
  getMonthlySalaryReport,
  getJobSalarySummary,
  exportSalaryReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes require authentication

router.get('/salary', getSalaryReport);
router.get('/salary/monthly', getMonthlySalaryReport);
router.get('/salary/export', exportSalaryReport);
router.get('/job-summary', getJobSalarySummary);

module.exports = router;

