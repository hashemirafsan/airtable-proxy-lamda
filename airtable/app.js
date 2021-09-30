const aws = require("aws-sdk");
const axios = require("axios");

const {
  AWS_ACCESS_KEY_ID_RAFSAN: accessKeyId,
  AWS_SECRET_ACCESS_KEY_RAFSAN: secretAccessKey,
  AIRTABLE_CLIENT_SECRET_KEY,
} = process.env;

const dynamo = new aws.DynamoDB.DocumentClient({
  accessKeyId,
  secretAccessKey,
  region: "us-east-1",
});

const dynamoTableName = "first_table";

exports.lambdaHandler = async (event, context) => {
  try {
    const params = JSON.parse(event.body);
    console.log(params);
    const datas = await dynamo
      .get({
        TableName: dynamoTableName,
        Key: {
          ProjectId: params.projectId,
        },
      })
      .promise();

    if (!datas?.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Resource Not Found",
        }),
      };
    }

    const getBases = async () => {
      return axios.get("https://api.airtable.com/v0/meta/bases", {
        headers: {
          Authorization: `Bearer ${datas?.Item.SecretKey}`,
          "X-Airtable-Client-Secret": AIRTABLE_CLIENT_SECRET_KEY,
        },
      });
    };

    const getTables = async (baseId) => {
      return axios.get(
        `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
        {
          headers: {
            Authorization: `Bearer ${datas?.Item.SecretKey}`,
            "X-Airtable-Client-Secret": AIRTABLE_CLIENT_SECRET_KEY,
          },
        }
      );
    };

    const getTable = async (baseId, tableName) => {
      return axios.get(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
        headers: {
          Authorization: `Bearer ${datas?.Item.SecretKey}`,
        },
      });
    };

    let response;
    switch (params?.action) {
      case "BASES":
        response = await getBases();
        break;
      case "TABLES":
        response = await getTables(params?.baseId);
        break;
      case "TABLE":
        response = await getTable(params?.baseId, params?.tableName);
        break;
      default:
        response = {
          data: {},
        };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (err) {
    console.log(err);
    return err;
  }
};
