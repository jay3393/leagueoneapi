const router = require('express').Router();
const buildController = require('../controllers/buildController');

router.get('/raw/:championId', buildController.getRawData);
router.get('/:championId', buildController.getBuild);

module.exports = router;