const serverlessExpress = require("@vendia/serverless-express");
const app = require("./express");

exports.handler = serverlessExpress({ app });
