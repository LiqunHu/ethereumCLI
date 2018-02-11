const util = require('util');
const db = require('./db');
const common = require('../util/CommonUtil');
const logger = require('./Logger').createLogger('Sequence');
const sequelize = db.sequelize;

let genUserID = async () => {
    try {
        let queryRst = await sequelize.query('select nextval(\'userIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('000000000000000' + queryRst[0].num).slice(-15)

        let today = (new Date()).Format("UIyyyyMMdd")

        return today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};
let genOrderID = async (user) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'orderIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyMM");

        return user.domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genSalesOrderID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'salesOrderIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'SO' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genPurchaseOrderID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'purchaseOrderIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'PO' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genPurchaseApplyID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'purchaseApplyIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'AP' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genCheckInventoryID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'checkInventoryIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'CI' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genTaskID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'taskIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        if (!domain) {
            domain = 0;
        }
        return 'TK' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genProductPlanID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'productPlanIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'PP' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genZWProcessID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'zoweeProcessIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'ZW' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genInvalidateOrderId = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'productPlanIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'IO' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genStockOutApplyId = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'productPlanIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'SO' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genApplyID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'applyIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'AY' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

let genOtherID = async (domain) => {
    try {
        let queryRst = await sequelize.query('select nextval(\'otherIDSeq\') num', {
            type: sequelize.QueryTypes.SELECT
        });
        let currentIndex = ('0000' + queryRst[0].num).slice(-4);

        let today = (new Date()).Format("yyyyMMdd");
        return 'OS' + domain + today + currentIndex;
    } catch (error) {
        logger.error(error);
        return error;
    }
};

module.exports = {
    genUserID: genUserID,
    genOrderID: genOrderID,
    genSalesOrderID: genSalesOrderID,
    genPurchaseOrderID: genPurchaseOrderID,
    genPurchaseApplyID: genPurchaseApplyID,
    genCheckInventoryID: genCheckInventoryID,
    genTaskID: genTaskID,
    genProductPlanID: genProductPlanID,
    genZWProcessID: genZWProcessID,
    genInvalidateOrderID: genInvalidateOrderId,
    genStockOutApplyId: genStockOutApplyId,
    genApplyID: genApplyID,
    genOtherID: genOtherID
};
