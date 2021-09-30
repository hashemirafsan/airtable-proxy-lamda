const aws = require("aws-sdk");
const axios = require("axios");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const compression = require("compression");
const app = express();
const router = express.Router();

router.use(compression());
router.use(cors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const {
  AWS_ACCESS_KEY_ID_RAFSAN: accessKeyId,
  AWS_SECRET_ACCESS_KEY_RAFSAN: secretAccessKey,
  AIRTABLE_CLIENT_SECRET_KEY,
  DYNAMO_DB_TABLE_NAME,
} = process.env;

const dynamo = new aws.DynamoDB.DocumentClient({
  accessKeyId,
  secretAccessKey,
  region: "us-east-1",
});

const getSecretKey = async (projectId) => {
  return dynamo
    .get({
      TableName: DYNAMO_DB_TABLE_NAME,
      Key: {
        ProjectId: projectId,
      },
    })
    .promise();
};

router.post("/v0/meta/bases", async (req, res) => {
  const secretItem = await getSecretKey(req.body.projectId);
  const response = await axios.get("https://api.airtable.com/v0/meta/bases", {
    headers: {
      Authorization: `Bearer ${secretItem?.Item.SecretKey}`,
      "X-Airtable-Client-Secret": AIRTABLE_CLIENT_SECRET_KEY,
    },
  });

  return res.json(response.data);
});

router.post("/v0/meta/bases/:baseId/tables", async (req, res) => {
  const secretItem = await getSecretKey(req.body.projectId);
  const response = await axios.get(
    `https://api.airtable.com/v0/meta/bases/${req.params.baseId}/tables`,
    {
      headers: {
        Authorization: `Bearer ${secretItem?.Item.SecretKey}`,
        "X-Airtable-Client-Secret": AIRTABLE_CLIENT_SECRET_KEY,
      },
    }
  );

  return res.json(response.data);
});

router.post("/v0/:baseId/:tableName", async (req, res) => {
  const secretItem = await getSecretKey(req.body.projectId);
  const response = await axios.get(
    `https://api.airtable.com/v0/${req.params.baseId}/${req.params.tableName}`,
    {
      headers: {
        Authorization: `Bearer ${secretItem?.Item.SecretKey}`,
        "X-Airtable-Client-Secret": AIRTABLE_CLIENT_SECRET_KEY,
      },
    }
  );

  return res.json(response.data);
});

// The serverless-express library creates a server and listens on a Unix
// Domain Socket for you, so you can remove the usual call to app.listen.
// app.listen(3000)
app.use("/", router);

// Export your express server so you can import it in the lambda function.
module.exports = app;
