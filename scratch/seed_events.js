const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Event = require('../models/Event');

const ORGANIZER_ID = '69f08ce90cf8c0596ae4f81e';

const events = [
  {
    title: 'Cubbon Park Green Sweep',
    description: 'Community-driven cleanup of Cubbon Park. Join us to collect litter and plant saplings along the walking trails.',
    category: 'cleanup',
    date: new Date('2026-05-10'),
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    address: 'Cubbon Park, Kasturba Road, Bangalore',
    wardName: 'Shivajinagar',
    capacity: 100, fundingGoal: 5000, status: 'upcoming',
  },
  {
    title: 'Lalbagh Tree Plantation Drive',
    description: 'Mass tree plantation session at Lalbagh Botanical Garden. Over 200 saplings to be planted by volunteers.',
    category: 'tree_plantation',
    date: new Date('2026-05-14'),
    location: { type: 'Point', coordinates: [77.5840, 12.9507] },
    address: 'Lalbagh Botanical Garden, South End Road, Bangalore',
    wardName: 'Lalbagh',
    capacity: 150, fundingGoal: 8000, status: 'upcoming',
  },
  {
    title: 'Ulsoor Lake Restoration',
    description: 'Hands-on lake cleanup and awareness drive at Ulsoor Lake. Help us restore this urban water body.',
    category: 'water_conservation',
    date: new Date('2026-05-18'),
    location: { type: 'Point', coordinates: [77.6208, 12.9813] },
    address: 'Ulsoor Lake, Ulsoor, Bangalore',
    wardName: 'Ulsoor',
    capacity: 80, fundingGoal: 12000, status: 'upcoming',
  },
  {
    title: 'Whitefield Recycling Awareness Camp',
    description: 'E-waste and plastic collection drive in Whitefield. Learn how to segregate waste and reduce landfill pressure.',
    category: 'recycling',
    date: new Date('2026-05-20'),
    location: { type: 'Point', coordinates: [77.7480, 12.9698] },
    address: 'Whitefield Main Road, Bangalore',
    wardName: 'Whitefield',
    capacity: 60, fundingGoal: 3000, status: 'upcoming',
  },
  {
    title: 'Hebbal Lake Biodiversity Walk',
    description: 'Educational walk around Hebbal Lake to observe migratory birds and wetland biodiversity. Expert naturalist guides.',
    category: 'wildlife',
    date: new Date('2026-05-22'),
    location: { type: 'Point', coordinates: [77.5929, 13.0450] },
    address: 'Hebbal Lake, Hebbal, Bangalore',
    wardName: 'Hebbal',
    capacity: 40, fundingGoal: 2000, status: 'upcoming',
  },
  {
    title: 'Koramangala Sustainability Workshop',
    description: 'Workshop on sustainable living — composting, solar energy, and zero-waste home practices. Free entry.',
    category: 'sustainability_workshop',
    date: new Date('2026-05-25'),
    location: { type: 'Point', coordinates: [77.6240, 12.9352] },
    address: 'Koramangala Indoor Stadium, Bangalore',
    wardName: 'Koramangala',
    capacity: 200, fundingGoal: 10000, status: 'upcoming',
  },
  {
    title: 'JP Nagar Plastic-Free March',
    description: 'Street awareness march through JP Nagar to promote plastic-free living. Bring your reusable bags!',
    category: 'awareness',
    date: new Date('2026-05-28'),
    location: { type: 'Point', coordinates: [77.5850, 12.9102] },
    address: '15th Cross, JP Nagar, Bangalore',
    wardName: 'JP Nagar',
    capacity: 300, fundingGoal: 1500, status: 'upcoming',
  },
  {
    title: 'Indiranagar Road Tree Guard Installation',
    description: 'Volunteer drive to install protective guards around newly planted trees on 100 Feet Road, Indiranagar.',
    category: 'tree_plantation',
    date: new Date('2026-06-02'),
    location: { type: 'Point', coordinates: [77.6386, 12.9784] },
    address: '100 Feet Road, Indiranagar, Bangalore',
    wardName: 'Indiranagar',
    capacity: 50, fundingGoal: 4000, status: 'upcoming',
  },
  {
    title: 'Malleshwaram Storm Drain Cleanup',
    description: 'Pre-monsoon stormwater drain clearance in Malleshwaram to prevent flooding. Gloves and tools provided.',
    category: 'cleanup',
    date: new Date('2026-06-05'),
    location: { type: 'Point', coordinates: [77.5717, 13.0035] },
    address: '18th Cross, Malleshwaram, Bangalore',
    wardName: 'Malleshwaram',
    capacity: 70, fundingGoal: 6000, status: 'upcoming',
  },
  {
    title: 'Electronic City Green Corridor',
    description: 'Tree plantation along the Electronic City Elevated Expressway service road to create a 2km green corridor.',
    category: 'tree_plantation',
    date: new Date('2026-06-08'),
    location: { type: 'Point', coordinates: [77.6762, 12.8458] },
    address: 'Electronic City Phase 1, Bangalore',
    wardName: 'Electronic City',
    capacity: 120, fundingGoal: 15000, status: 'upcoming',
  },
  {
    title: 'Bannerghatta Road Composting Drive',
    description: 'Community composting setup workshop. Learn how to turn kitchen waste into garden gold at home.',
    category: 'sustainability_workshop',
    date: new Date('2026-06-12'),
    location: { type: 'Point', coordinates: [77.5980, 12.8816] },
    address: 'Bannerghatta Road, Arekere, Bangalore',
    wardName: 'Arekere',
    capacity: 90, fundingGoal: 3500, status: 'upcoming',
  },
  {
    title: 'Yelahanka New Town Sapling Giveaway',
    description: 'Free sapling distribution event. Each family gets 3 native species saplings with planting guidance.',
    category: 'tree_plantation',
    date: new Date('2026-06-15'),
    location: { type: 'Point', coordinates: [77.5963, 13.1007] },
    address: 'Yelahanka New Town, Bangalore',
    wardName: 'Yelahanka',
    capacity: 500, fundingGoal: 20000, status: 'upcoming',
  },
  {
    title: 'HSR Layout E-Waste Collection',
    description: 'Designated e-waste drop points for old electronics. Proper recycling ensured by certified vendors.',
    category: 'recycling',
    date: new Date('2026-06-18'),
    location: { type: 'Point', coordinates: [77.6404, 12.9116] },
    address: 'Sector 2, HSR Layout, Bangalore',
    wardName: 'HSR Layout',
    capacity: 0, fundingGoal: 5000, status: 'upcoming',
  },
  {
    title: 'Nagavara Lake Water Quality Test',
    description: 'Citizen science event to collect water samples from Nagavara Lake for chemical analysis.',
    category: 'water_conservation',
    date: new Date('2026-06-20'),
    location: { type: 'Point', coordinates: [77.6258, 13.0534] },
    address: 'Nagavara Lake, HBR Layout, Bangalore',
    wardName: 'Nagavara',
    capacity: 30, fundingGoal: 8000, status: 'upcoming',
  },
  {
    title: 'Rajajinagar Wildlife Photo Walk',
    description: 'Photography walk focused on urban wildlife — insects, birds, and reptiles in residential gardens.',
    category: 'wildlife',
    date: new Date('2026-06-22'),
    location: { type: 'Point', coordinates: [77.5540, 12.9935] },
    address: 'Rajajinagar 3rd Block, Bangalore',
    wardName: 'Rajajinagar',
    capacity: 25, fundingGoal: 1000, status: 'upcoming',
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Seeding events...');

  let inserted = 0;
  for (const ev of events) {
    await Event.create({ ...ev, organizer: ORGANIZER_ID });
    console.log(`✅ Created: ${ev.title} @ ${ev.location.coordinates}`);
    inserted++;
  }

  console.log(`\n🎉 Done! Inserted ${inserted} events.`);
  mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
