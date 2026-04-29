const mongoose = require('mongoose');
require('dotenv').config();
const Issue = require('../models/Issue');

const titles = [
  'Severe Garbage Accumulation',
  'Frequent Street Flooding',
  'Hazardous Road Potholes',
  'Illegal Industrial Discharge',
  'Trees Cut for Billboard'
];

async function update() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const res = await Issue.updateMany(
      { title: { $in: titles } },
      { $set: { status: 'verified' } }
    );
    console.log(`Successfully updated ${res.modifiedCount} reports to VERIFIED status.`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

update();
