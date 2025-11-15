const express = require('express');
const {
  createTimeEntry,
  getTimeEntries,
  getTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getTimeEntriesSummary,
} = require('../controllers/timeEntryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes require authentication

router.get('/summary/stats', getTimeEntriesSummary);

router.route('/')
  .get(getTimeEntries)
  .post(createTimeEntry);

router.route('/:id')
  .get(getTimeEntry)
  .put(updateTimeEntry)
  .delete(deleteTimeEntry);

module.exports = router;

