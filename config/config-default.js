const config = {
    // for logger
    loggerConfig: {
        level: 'DEBUG',
        config: {
            "appenders": [{
                "type": "console",
                "appenders": [{
                        "type": "dateFile",
                        "filename": "log/access.log",
                        "pattern": "-yyyy-MM-dd",
                        "category": "http"
                    },
                    {
                        "type": "file",
                        "filename": "log/app.log",
                        "maxLogSize": 10485760,
                        "numBackups": 3
                    },
                    {
                        "type": "logLevelFilter",
                        "level": "ERROR",
                        "appender": {
                            "type": "file",
                            "filename": "log/errors.log"
                        }
                    }
                ],
                replaceConsole: true
            }]
        }
    },
    uploadOptions: {
        uploadDir: 'public/temp',
        maxFileSize: 2 * 1024 * 1024,
        keepExtensions: true
    },
    datadir: '/Users/huliqun/geth/geth_private_data',
    tempDir: 'public/temp',
    filesDir: 'public/files',
    tmpUrlBase: '/temp/',
    fileUrlBase: '/files/',
};

module.exports = config;
