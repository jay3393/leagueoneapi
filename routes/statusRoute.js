const router = require('express').Router();
const statusController = require('../controllers/statusController');

router.get('/', statusController.getStatus);
router.get('/matches', statusController.getMatches);
router.get('/champions', statusController.getChampions);

module.exports = router;