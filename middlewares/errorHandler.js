const { logEvents } = require("./logger");

module.exports.errorHandler = (err, req, res, next) => {
  logEvents(
    `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
    "errLog.log"
  );

  const status = res.statusCode === 200 ? 500 : res.statusCode;
  console.log(err);
  res.status(status).json({ message: err?.message });
};
