const formidable = require('formidable');
const gm = require('gm').subClass({
    imageMagick: true
});
const uuid = require('uuid');
const path = require('path');
const fs = require('fs');
const mongodb = require('mongodb');
const mime = require('mime-types');
const ejs = require('ejs');
const format = require('util').format;

const config = require('../config');
const Error = require('./Error');
const logger = require('./Logger').createLogger('CommonUtil.js');
const iconv = require('iconv-lite');
const csv = require('csvtojson');

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.Format = function(fmt) { //author: meizz
    let o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

// String trim
String.prototype.trim = function() {
    //return this.replace(/[(^\s+)(\s+$)]/g,"");//會把字符串中間的空白符也去掉
    //return this.replace(/^\s+|\s+$/g,""); //
    return this.replace(/^\s+/g, "").replace(/\s+$/g, "");
}

// common response
function docTrim(req) {
    let doc = req
    for (let idx in doc) { //不使用过滤
        if (typeof(doc[idx]) == "string") {
            doc[idx] = doc[idx].trim();
        }
    }
    return doc
}

// common response
function sendData(res, data) {
    let datares = arguments[1] ? arguments[1] : {};
    let sendData = {
        errno: 0,
        msg: 'ok',
        info: datares
    };
    res.send(sendData);
}

function sendError(res, errno, msg = '错误未配置') {
    let errnores = arguments[1] ? arguments[1] : -1;
    let msgres = arguments[2] ? arguments[2] : 'error';
    let sendData;
    if (errnores in Error) {
        sendData = {
            errno: errnores,
            msg: Error[errnores]
        };
    } else {
        sendData = {
            errno: errnores,
            msg: msg
        };
    }
    res.status(700).send(sendData);
}

function sendFault(res, msg) {
    let msgres = arguments[1] ? arguments[1] : 'Internal Error';
    let sendData = {};
    logger.error(msg);
    if (process.env.NODE_ENV === 'test') {
        sendData = {
            errno: -1,
            msg: msgres.message,
        };
    } else {
        sendData = {
            errno: -1,
            msg: 'Internal Error',
        };
    }
    res.status(500).send(sendData);
}

function fileSave(req) {
    return new Promise(function(resolve, reject) {
        if (req.is('multipart/*')) {
            try {
                let form = new formidable.IncomingForm(config.uploadOptions);
                form.parse(req, (err, fields, files) => {
                    if (err) {
                        reject(err);
                    }
                    if (files.avatar_file) {
                        let filename = uuid.v4() + '.jpg'
                        let tmpFile = path.join(__dirname, '../' + config.uploadOptions.uploadDir + '/' + filename)
                        let avatar_data = JSON.parse(fields.avatar_data);
                        gm(files.avatar_file.path)
                            .setFormat("jpeg")
                            .crop(avatar_data.width, avatar_data.height, avatar_data.x, avatar_data.y)
                            .rotate('white', fields.avatar_data.rotate)
                            .write(tmpFile, function(err) {
                                if (!err) resolve(config.tmpUrlBase + filename);
                                reject(err);
                            })
                    } else if (files.file) {
                        let ext = path.extname(files.file.name)
                        let imageExt = ['.BMP', '.JPG', '.JPEG', '.GIF', '.PNG']
                        if (ext) {
                            if (imageExt.indexOf(ext.toUpperCase()) >= 0) {
                                let filename = uuid.v4() + '.jpg'
                                let tmpFile = path.join(__dirname, '../' + config.uploadOptions.uploadDir + '/' + filename)
                                gm(files.file.path)
                                    .compress("jpeg")
                                    .write(tmpFile, function(err) {
                                        if (!err) {
                                            fs.unlinkSync(files.file.path)
                                            resolve({
                                                name: files.file.name,
                                                ext: path.extname(filename),
                                                url: config.tmpUrlBase + filename,
                                                type: mime.lookup(path.extname(filename))
                                            })
                                        } else {
                                            reject(err);
                                        }
                                    })
                            } else {
                                resolve({
                                    name: files.file.name,
                                    ext: path.extname(files.file.name),
                                    url: config.tmpUrlBase + path.basename(files.file.path),
                                    type: files.file.type,
                                })
                            }
                        }
                    } else {
                        reject('no files');
                    }
                })
            } catch (error) {
                reject(error);
            }
        } else {
            reject('content-type error');
        }
    })
}

function fileMove(url, mode) {
    return new Promise(async function(resolve, reject) {
        if (url) {
            let fileName = path.basename(url)
            let relPath = ''
            let today = new Date()
            if (mode == 'avatar') {
                relPath = 'avatar/' + today.getFullYear() + '/' + today.getMonth() + '/' + today.getDate() + '/'
            } else if (mode == 'upload') {
                relPath = 'upload/' + today.getFullYear() + '/' + today.getMonth() + '/' + today.getDate() + '/'
            } else {
                reject('mode error');
            }

            let svPath = path.join(__dirname, '../' + config.filesDir + '/' + relPath);

            if (!fs.existsSync(svPath)) {
                mkdirssync(svPath)
            }

            let tempfile = path.join(__dirname, '../' + config.uploadOptions.uploadDir + '/' + fileName);
            if (config.mongoFlag) {
                let connectStr = ''
                if (config.mongo.auth) {
                    connectStr = format(config.mongo.connect,
                        config.mongo.auth.username, config.mongo.auth.password);
                } else {
                    connectStr = config.mongo.connect
                }
                mongodb.MongoClient.connect(connectStr, async function(err, db) {
                    if (err) reject(err)
                    try {
                        // Our file ID
                        let fileId = new mongodb.ObjectID();
                        let mongoName = fileId + path.extname(fileName)
                        let gridStore = new mongodb.GridStore(db, fileId, mongoName, 'w', {
                            content_type: mime.lookup(fileName)
                        })
                        let gs = await gridStore.open()
                        let fileData = fs.readFileSync(tempfile);
                        await gs.write(fileData)
                        await gs.close()
                        fs.unlinkSync(tempfile)
                        db.close()
                        resolve(config.fileUrlBase + mongoName)
                    } catch (error) {
                        db.close()
                        reject(error);
                    }
                });
            } else {
                fs.renameSync(tempfile, path.join(svPath, fileName))
                resolve(config.fileUrlBase + relPath + fileName);
            }
        } else {
            reject('url error');
        }
    })
}

function fileGet(url) {
    return new Promise(async function(resolve, reject) {
        if (url) {
            let connectStr = ''
            if (config.mongo.auth) {
                connectStr = format(config.mongo.connect,
                    config.mongo.auth.username, config.mongo.auth.password);
            } else {
                connectStr = config.mongo.connect
            }
            mongodb.MongoClient.connect(connectStr, async function(err, db) {
                if (err) reject(err)
                try {
                    let fileName = path.basename(url)
                    let gridStore = new mongodb.GridStore(db, fileName, 'r')
                    gridStore.open(function(err, gs) {
                        if (err) {
                            reject(err);
                        }
                        gridStore.seek(0, function() {
                            gridStore.read(function(err, data) {
                                if (err) {
                                    reject(err);
                                }
                                db.close();
                                resolve(data)
                            });
                        })
                    })
                } catch (error) {
                    db.close()
                    reject(error);
                }
            });
        } else {
            reject('url error');
        }
    })
}

function fileRemove(url) {
    return new Promise(async function(resolve, reject) {
        if (url) {
            if (config.mongoFlag) {
                let connectStr = ''
                if (config.mongo.auth) {
                    connectStr = format(config.mongo.connect,
                        config.mongo.auth.username, config.mongo.auth.password);
                } else {
                    connectStr = config.mongo.connect
                }
                mongodb.MongoClient.connect(connectStr, async function(err, db) {
                    if (err) reject(err)
                    try {
                        let fileName = path.basename(url)
                        // Our file ID
                        mongodb.GridStore.unlink(db, fileName, function(err) {
                            if (err) reject(err)
                            db.close()
                            resolve('ok')
                        })
                    } catch (error) {
                        db.close()
                        reject(error);
                    }
                });
            } else {
                resolve(config.fileUrlBase + relPath + fileName);
            }
        } else {
            reject('url error');
        }
    })
}

function mkdirssync(dirpath) {
    try {
        if (!fs.existsSync(dirpath)) {
            let pathtmp;
            dirpath.split(/[/\\]/).forEach(function(dirname) { //这里指用/ 或\ 都可以分隔目录  如  linux的/usr/local/services   和windows的 d:\temp\aaaa
                if (dirname) {
                    if (pathtmp) {
                        pathtmp = path.join(pathtmp, dirname);
                    } else {
                        pathtmp = '/' + dirname;
                    }
                    if (!fs.existsSync(pathtmp)) {
                        if (!fs.mkdirSync(pathtmp)) {
                            return false;
                        }
                    }
                }
            });
        }
        return true;
    } catch (e) {
        logger.error("create director fail! path=" + dirpath + " errorMsg:" + e);
        return false;
    }
}

function generateRandomAlphaNum(len) {
    let charSet = '0123456789';
    let randomString = '';
    for (let i = 0; i < len; i++) {
        let randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
}

//列表分页查询，查询语句queryStr传完整的sql语句
async function queryWithCount(db, req, queryStr, replacements) {
    let doc = req.body

    let cnt = queryStr.indexOf("from") + 5;
    let queryStrCnt = queryStr.substr(cnt);

    let count = await db.query('select count(*) num from ' + queryStrCnt, {
        replacements: replacements,
        type: db.QueryTypes.SELECT
    })

    let rep = replacements
    rep.push(doc.offset || 0)
    rep.push(doc.limit || 100)

    let queryRst = await db.query(queryStr + ' LIMIT ?,?', {
        replacements: rep,
        type: db.QueryTypes.SELECT
    })

    return {
        count: count[0].num,
        data: queryRst
    }
}

async function queryWithDocCount(db, doc, queryStr, replacements) {
    let cnt = queryStr.indexOf("from") + 5;
    let queryStrCnt = queryStr.substr(cnt);

    let count = await db.query('select count(*) num from ' + queryStrCnt, {
        replacements: replacements,
        type: db.QueryTypes.SELECT
    })

    let rep = replacements
    rep.push(doc.offset || 0)
    rep.push(doc.limit || 100)

    let queryRst = await db.query(queryStr + ' LIMIT ?,?', {
        replacements: rep,
        type: db.QueryTypes.SELECT
    })

    return {
        count: count[0].num,
        data: queryRst
    }
}

async function queryWithGroupByCount(db, req, queryStr, replacements) {
    let doc = req.body

    let count = await db.query('select count(*) num from (' + queryStr + ') as count', {
        replacements: replacements,
        type: db.QueryTypes.SELECT
    })

    let rep = replacements
    rep.push(doc.offset || 0)
    rep.push(doc.limit || 100)

    let queryRst = await db.query(queryStr + ' LIMIT ?,?', {
        replacements: rep,
        type: db.QueryTypes.SELECT
    })

    return {
        count: count[0].num,
        data: queryRst
    }
}

async function simpleSelect(db, queryStr, replacements) {
    return await db.query(queryStr, {
        replacements: replacements,
        type: db.QueryTypes.SELECT
    });
}

function getApiName(path) {
    if (path) {
        let patha = path.split('/')
        let func = patha[patha.length - 1].toUpperCase()
        return func;
    } else {
        return ''
    }
}

function buildXML(json) {
    let builder = new xml2js.Builder();
    return builder.buildObject(json);
};

function parseXML(xml) {
    return new Promise(function(resolve, reject) {
        let parser = new xml2js.Parser({
            trim: true,
            explicitArray: false,
            explicitRoot: false
        });
        parser.parseString(xml, function(err, result) {
            if (err) reject(err)
            resolve(result)
        });
    })
};

function generateNonceString(length) {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let maxPos = chars.length;
    let noceStr = "";
    for (let i = 0; i < (length || 32); i++) {
        noceStr += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return noceStr;
};

function getUploadTempPath(uploadurl) {
    let fileName = path.basename(uploadurl);
    return path.join(__dirname, '../' + config.uploadOptions.uploadDir + '/' + fileName);
}

function csvtojsonByPath(uploadurl) {
    return new Promise((resolve, reject) => {
        let fileName = path.basename(uploadurl);
        let filePath = path.join(__dirname, '../' + config.uploadOptions.uploadDir + '/' + fileName);
        fs.readFile(filePath, function(err, data) {
            if (err) {
                reject(err.stack);
            }

            let result = [];
            csv({
                    noheader: true
                })
                .fromString(data.toString())
                .on('csv', (csvRow) => {
                    result.push(csvRow);
                })
                .on('done', () => {
                    resolve(result);
                })
        });
    });
}

function csvtojsonByUrl(uploadurl) {
    return new Promise(function(resolve, reject) {
        try {
            let retArray = [];
            let fileStr = '';
            let fileName = path.basename(uploadurl);
            let tempfile = path.join(__dirname, '../' + config.uploadOptions.uploadDir + '/' + fileName);

            let fileStream = fs.createReadStream(tempfile);
            fileStream.on('data', function(data) {
                fileStr += iconv.decode(data, 'gbk');
            });
            fileStream.on('end', function() {
                retArray = fileStr.toString().split('\r');
                resolve(retArray)
            })

        } catch (error) {
            reject(error);
        }
    })
}

function getUUIDByTime(offset) {
    let uuidStand = uuid.v1();
    let uuidArr = uuidStand.split('-');
    let uuidResult = '';

    for (let i = 0; i < uuidArr.length; i++) {
        uuidResult += uuidArr[i]
    }
    return uuidResult.substring(0, offset)

}

module.exports = {
    docTrim: docTrim,
    sendData: sendData,
    sendError: sendError,
    sendFault: sendFault,
    fileSave: fileSave,
    fileMove: fileMove,
    fileGet: fileGet,
    fileRemove: fileRemove,
    getUploadTempPath: getUploadTempPath,
    csvtojsonByPath: csvtojsonByPath,
    csvtojsonByUrl: csvtojsonByUrl,
    generateRandomAlphaNum: generateRandomAlphaNum,
    simpleSelect: simpleSelect,
    queryWithCount: queryWithCount,
    queryWithDocCount: queryWithDocCount,
    queryWithGroupByCount: queryWithGroupByCount,
    getApiName: getApiName,
    buildXML: buildXML,
    parseXML: parseXML,
    generateNonceString: generateNonceString,
    getUUIDByTime: getUUIDByTime
};
