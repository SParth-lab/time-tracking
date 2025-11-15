const express = require('express');
const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  addRateChange,
  getRateHistory,
} = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes require authentication

router.route('/')
  .get(getJobs)
  .post(createJob);

router.route('/:id')
  .get(getJob)
  .put(updateJob)
  .delete(deleteJob);

router.post('/:id/rate-change', addRateChange);
router.get('/:id/rate-history', getRateHistory);

module.exports = router;

