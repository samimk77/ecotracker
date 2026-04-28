const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Issue = require('./models/Issue');
const User = require('./models/User');
const Ward = require('./models/Ward');
const Event = require('./models/Event');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🌿 MongoDB Connected for seeding...');

    // Clear existing data for a fresh start
    await User.deleteMany({ email: { $in: ['user@ecoimpact.com', 'mod@ecoimpact.com', 'authority@ecoimpact.com'] } });
    await Issue.deleteMany({ title: /Demo/ });
    await Ward.deleteMany({ name: /Green Valley|Blue River/ });
    await Event.deleteMany({ title: /Demo/ });

    console.log('🧹 Cleaned up existing demo data.');

    // 1. Create Demo Wards
    const wards = await Ward.insertMany([
      {
        name: 'Green Valley Ward',
        number: 101,
        district: 'Central',
        city: 'EcoCity',
        state: 'EcoState',
        authorityEmail: 'warden@ecocity.gov',
        authorityName: 'Commissioner Green',
        center: { type: 'Point', coordinates: [77.5946, 12.9716] },
        boundary: {
          type: 'Polygon',
          coordinates: [[[77.58, 12.96], [77.61, 12.96], [77.61, 12.98], [77.58, 12.98], [77.58, 12.96]]]
        }
      },
      {
        name: 'Blue River Ward',
        number: 102,
        district: 'North',
        city: 'EcoCity',
        state: 'EcoState',
        authorityEmail: 'river-mod@ecocity.gov',
        authorityName: 'Director Blue',
        center: { type: 'Point', coordinates: [77.6101, 12.9307] },
        boundary: {
          type: 'Polygon',
          coordinates: [[[77.60, 12.92], [77.63, 12.92], [77.63, 12.94], [77.60, 12.94], [77.60, 12.92]]]
        }
      }
    ]);

    console.log('🏙️ Created demo wards.');

    // 2. Create Demo User
    const plainPassword = 'password123';

    const demoUser = await User.create({
      name: 'Eco Warrior',
      email: 'user@ecoimpact.com',
      password: plainPassword,
      role: 'user',
      ward: wards[0]._id,
      wardName: wards[0].name,
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      stats: {
        impactScore: 450,
        issuesRaised: 12,
        issuesVerified: 45,
        issuesResolved: 8
      }
    });

    const demoMod = await User.create({
      name: 'Guardian Mod',
      email: 'mod@ecoimpact.com',
      password: plainPassword,
      role: 'moderator',
      moderatorWard: wards[0]._id,
      ward: wards[0]._id,
      wardName: wards[0].name
    });

    const demoAuthority = await User.create({
      name: 'City Commissioner',
      email: 'authority@ecoimpact.com',
      password: plainPassword,
      role: 'authority',
      ward: wards[0]._id,
      wardName: wards[0].name
    });


    console.log('👤 Created demo users:');
    console.log('   - user@ecoimpact.com / password123');
    console.log('   - mod@ecoimpact.com / password123');
    console.log('   - authority@ecoimpact.com / password123');


    // 3. Create Demo Issues
    const issues = await Issue.insertMany([
      {
        title: 'Demo: Open Garbage Dump',
        description: 'Large pile of plastic and organic waste accumulating near the community park. Attracting pests and causing foul odor.',
        category: 'garbage',
        urgencyLevel: 'high',
        urgencyScore: 75,
        status: 'open',
        author: demoUser._id,
        ward: wards[0]._id,
        wardName: wards[0].name,
        location: { type: 'Point', coordinates: [77.5948, 12.9720] },
        address: 'Central Park North Entrance',
        upvoteCount: 24,
        verificationCount: 8
      },
      {
        title: 'Demo: River Pollution Source',
        description: 'Visible oil sheen and chemical discharge observed from the industrial pipe near Blue River bridge.',
        category: 'waterlogging',
        urgencyLevel: 'critical',
        urgencyScore: 95,
        status: 'escalated',
        author: demoUser._id,
        ward: wards[1]._id,
        wardName: wards[1].name,
        location: { type: 'Point', coordinates: [77.6110, 12.9315] },
        address: 'Blue River Industrial Bypass',
        upvoteCount: 156,
        verificationCount: 42,
        escalationEmailSent: true
      },
      {
        title: 'Demo: Illegal Tree Felling',
        description: 'Unmarked trucks seen removing mature trees from the protected zone during night hours.',
        category: 'deforestation',
        urgencyLevel: 'medium',
        urgencyScore: 45,
        status: 'verified',
        author: demoUser._id,
        ward: wards[0]._id,
        wardName: wards[0].name,
        location: { type: 'Point', coordinates: [77.5930, 12.9710] },
        address: 'West Green Belt Perimeter',
        upvoteCount: 12,
        verificationCount: 5
      }
    ]);

    console.log('⚠️ Created demo issues.');

    // 4. Create Demo Events
    await Event.insertMany([
      {
        title: 'Demo Event: Park Cleanup Drive',
        description: 'Join us for a community cleanup event at the Central Park. Gloves and bags will be provided!',
        category: 'cleanup',
        organizer: demoUser._id,
        date: new Date(Date.now() + 86400000 * 2), // 2 days later
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        address: 'Central Park Main Square',
        ward: wards[0]._id,
        wardName: wards[0].name,
        capacity: 50,
        participantCount: 15,
        status: 'upcoming'
      },
      {
        title: 'Demo Event: Tree Plantation Marathon',
        description: 'Planting 500 saplings along the Blue River bank to prevent soil erosion.',
        category: 'tree_plantation',
        organizer: demoMod._id,
        date: new Date(Date.now() + 86400000 * 5), // 5 days later
        location: { type: 'Point', coordinates: [77.6101, 12.9307] },
        address: 'Blue River Bank - South Sector',
        ward: wards[1]._id,
        wardName: wards[1].name,
        fundingGoal: 5000,
        fundsRaised: 1200,
        status: 'upcoming'
      }
    ]);

    console.log('📅 Created demo events.');
    console.log('\n✅ Seeding completed successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seedData();
