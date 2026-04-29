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
        title: 'Demo: Massive Waste Pile',
        description: 'Large accumulation of plastic and construction debris blocking the sidewalk. Residents reporting strong odors.',
        category: 'garbage', urgencyLevel: 'high', urgencyScore: 80, status: 'open',
        author: demoUser._id, wardName: 'Indiranagar Ward',
        location: { type: 'Point', coordinates: [77.6411, 12.9784] }, address: '100 Feet Rd, Indiranagar',
        beforeImage: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800',
        upvoteCount: 45, verificationCount: 12
      },
      {
        title: 'Demo: Road Sinkhole Detected',
        description: 'Dangerous sinkhole forming after heavy rains. Poses immediate risk to two-wheelers and pedestrians.',
        category: 'road_damage', urgencyLevel: 'critical', urgencyScore: 95, status: 'escalated',
        author: demoUser._id, wardName: 'Koramangala Ward',
        location: { type: 'Point', coordinates: [77.6226, 12.9352] }, address: '80 Feet Rd, Koramangala',
        beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800',
        upvoteCount: 182, verificationCount: 56
      },
      {
        title: 'Report: Industrial Dye Discharge',
        description: 'Dark blue effluent being discharged into the lake inlet from a hidden pipe. Strong chemical odor detected.',
        category: 'water_scarcity', urgencyLevel: 'critical', urgencyScore: 96, status: 'escalated',
        author: demoUser._id, wardName: 'JP Nagar Ward',
        location: { type: 'Point', coordinates: [77.5865, 12.9073] }, address: 'Sarakki Lake Perimeter',
        beforeImage: 'https://images.unsplash.com/photo-1574689049868-e94ed5301745?auto=format&fit=crop&q=80&w=800',
        upvoteCount: 190, verificationCount: 45
      },
      {
        title: 'Report: Unauthorized Canopy Clearance',
        description: 'Several mature Gulmohar trees being cut down without visible BBMP permits behind the residential complex.',
        category: 'deforestation', urgencyLevel: 'high', urgencyScore: 88, status: 'open',
        author: demoUser._id, wardName: 'JP Nagar Ward',
        location: { type: 'Point', coordinates: [77.5855, 12.9063] }, address: 'JP Nagar 2nd Phase',
        beforeImage: 'https://images.unsplash.com/photo-1510006851064-e6056cd0e3a8?auto=format&fit=crop&q=80&w=800',
        upvoteCount: 75, verificationCount: 20
      },
      {
        title: 'Demo: Sewage Overflow',
        description: 'Blocked drain causing raw sewage to flow onto the main road near the school entrance.',
        category: 'sewage', urgencyLevel: 'critical', urgencyScore: 90, status: 'escalated',
        author: demoUser._id, wardName: 'Malleshwaram Ward',
        location: { type: 'Point', coordinates: [77.5694, 13.0031] }, address: '15th Cross, Malleshwaram',
        beforeImage: 'https://images.unsplash.com/photo-1544216717-3bbf52512659?auto=format&fit=crop&q=80&w=800',
        upvoteCount: 124, verificationCount: 34
      },
      {
        title: 'Demo: Air Quality Anomaly',
        description: 'Sustained acrid smoke detected from unauthorized backyard plastic burning at multiple locations.',
        category: 'air_pollution', urgencyLevel: 'high', urgencyScore: 78, status: 'verified',
        author: demoUser._id, wardName: 'HSR Layout Ward',
        location: { type: 'Point', coordinates: [77.6453, 12.9105] }, address: 'Sector 2, HSR Layout',
        beforeImage: 'https://images.unsplash.com/photo-1536147116438-62679a5e01f2?auto=format&fit=crop&q=80&w=800',
        upvoteCount: 89, verificationCount: 22
      },
      {
        title: 'Demo: Chemical Dumping',
        description: 'Anonymous report of chemical drums being discarded in the vacant lot behind the textile mill.',
        category: 'illegal_dumping', urgencyLevel: 'critical', urgencyScore: 98, status: 'escalated',
        author: demoUser._id, wardName: 'Yeshwanthpur Ward',
        location: { type: 'Point', coordinates: [77.5501, 13.0245] }, address: 'Railway Parallel Rd, Yeshwanthpur',
        beforeImage: 'https://images.unsplash.com/photo-1599305090598-fe179d501c27?auto=format&fit=crop&q=80&w=800',
        upvoteCount: 210, verificationCount: 88
      },
      {
        title: 'Demo: Waterlogging Hub',
        description: 'Standard drainage failure causing 2ft water standing on main junction every time it rains.',
        category: 'waterlogging', urgencyLevel: 'high', urgencyScore: 82, status: 'verified',
        author: demoUser._id, wardName: 'Hebbal Ward',
        location: { type: 'Point', coordinates: [77.5912, 13.0354] }, address: 'Hebbal Flyover Junction',
        beforeImage: 'https://images.unsplash.com/photo-1510448914530-58079632811a?auto=format&fit=crop&q=80&w=800',
        upvoteCount: 156, verificationCount: 45
      },
      {
        title: 'Hotspot: Massive Electrical Hazard',
        description: 'Low-hanging live wires sparked and caused minor fire.',
        category: 'other', urgencyLevel: 'critical', urgencyScore: 96, status: 'escalated',
        author: demoUser._id, wardName: 'MG Road Sector',
        location: { type: 'Point', coordinates: [77.6067, 12.9733] }, address: 'Brigade Road Junction',
        beforeImage: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=800',
        upvoteCount: 350, verificationCount: 95
      },
      {
        title: 'Hotspot: Industrial Acid Dump',
        description: 'Barrels of unknown acid left near the metro pillar.',
        category: 'illegal_dumping', urgencyLevel: 'critical', urgencyScore: 99, status: 'escalated',
        author: demoUser._id, wardName: 'MG Road Sector',
        location: { type: 'Point', coordinates: [77.6070, 12.9730] }, address: 'MG Road Hotspot',
        beforeImage: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&q=80&w=800',
        upvoteCount: 600, verificationCount: 150
      },
      {
        title: 'Hotspot: Structural Road Collapse',
        description: 'Entire road segment subsided into underground canal.',
        category: 'road_damage', urgencyLevel: 'critical', urgencyScore: 98, status: 'escalated',
        author: demoUser._id, wardName: 'Indiranagar Ward',
        location: { type: 'Point', coordinates: [77.6410, 12.9790] }, address: 'Indiranagar Hotspot',
        beforeImage: 'https://images.unsplash.com/photo-1584462970667-0625af507c03?auto=format&fit=crop&q=80&w=800',
        upvoteCount: 500, verificationCount: 120
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
