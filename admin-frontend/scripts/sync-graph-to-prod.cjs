const { DynamoDBClient, ScanCommand, BatchWriteItemCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: 'eu-central-1' });

const SOURCE_TABLE = 'reelquest-dev-data';
const TARGET_TABLE = 'reelquest-prod-data';
const BATCH_SIZE = 25;

async function syncGraph() {
  console.log(`Starting Cinema Graph sync: ${SOURCE_TABLE} -> ${TARGET_TABLE}...`);
  const startTime = Date.now();

  let lek = undefined;
  let totalCopied = 0;
  let page = 0;

  do {
    page++;
    // Scan source table for graph items (ACTOR# and MOVIE#)
    const scanRes = await client.send(new ScanCommand({
      TableName: SOURCE_TABLE,
      FilterExpression: 'begins_with(PK, :actor) OR begins_with(PK, :movie)',
      ExpressionAttributeValues: {
        ':actor': { S: 'ACTOR#' },
        ':movie': { S: 'MOVIE#' }
      },
      ExclusiveStartKey: lek,
      Limit: 500
    }));

    lek = scanRes.LastEvaluatedKey;
    const items = scanRes.Items || [];

    if (items.length > 0) {
      // Chunk into batches of 25
      const chunks = [];
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        chunks.push(items.slice(i, i + BATCH_SIZE));
      }

      await Promise.all(chunks.map(async (chunk) => {
        const writeRequests = chunk.map(item => ({
          PutRequest: { Item: item }
        }));

        let unprocessed = writeRequests;
        let attempts = 0;
        while (unprocessed && unprocessed.length > 0 && attempts < 5) {
          attempts++;
          const batchRes = await client.send(new BatchWriteItemCommand({
            RequestItems: {
              [TARGET_TABLE]: unprocessed
            }
          }));

          unprocessed = batchRes.UnprocessedItems?.[TARGET_TABLE] || [];
          if (unprocessed.length > 0) {
            await new Promise(r => setTimeout(r, 50 * attempts));
          }
        }
      }));

      totalCopied += items.length;
      if (page % 10 === 0 || !lek) {
        console.log(`[Page ${page}] Copied ${totalCopied} graph entities... (${((Date.now() - startTime) / 1000).toFixed(1)}s)`);
      }
    }
  } while (lek);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Sync completed! Total ${totalCopied} graph entities synced to ${TARGET_TABLE} in ${durationSec}s.`);
}

syncGraph().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
