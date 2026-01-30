/**
 * Migration script to fix relative resume paths to absolute paths in MongoDB
 * Run this once to fix existing bids
 */

const { MongoClient } = require('mongodb');
const path = require('path');

const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'job-bid-system';
const BASE_DIR = path.resolve(__dirname, 'uploads');

async function fixResumePaths() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DB_NAME);
    const bidsCollection = db.collection('bids');

    // Find all bids
    const bids = await bidsCollection.find({}).toArray();
    console.log(`Found ${bids.length} bids`);

    let updated = 0;

    for (const bid of bids) {
      // Check if resumePath is relative (doesn't start with drive letter or /)
      if (bid.resumePath && !path.isAbsolute(bid.resumePath)) {
        const absoluteResumePath = path.resolve(BASE_DIR, bid.resumePath);
        const absoluteJDPath = path.resolve(BASE_DIR, bid.jobDescriptionPath);

        console.log(`Updating bid ${bid.domainId}:`);
        console.log(`  Resume: ${bid.resumePath} -> ${absoluteResumePath}`);
        console.log(`  JD: ${bid.jobDescriptionPath} -> ${absoluteJDPath}`);

        await bidsCollection.updateOne(
          { _id: bid._id },
          {
            $set: {
              resumePath: absoluteResumePath,
              jobDescriptionPath: absoluteJDPath,
              updatedAt: new Date()
            }
          }
        );

        updated++;
      }
    }

    console.log(`\nUpdated ${updated} bids with absolute paths`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

fixResumePaths();
