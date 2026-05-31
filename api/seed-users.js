require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDb } = require('./firebase');

async function seedUsers() {
  try {
    const db = getDb();

    const users = [
      {
        username: 'office_staff',
        password: 'password123',
        email: 'officestaff@faculty-portal.local',
        full_name: 'Office Staff',
        department: 'Office',
        role: 'officestaff',
        is_hod: false,
        is_registry: false,
        is_principal: false
      },
      {
        username: 'head_clerk',
        password: 'office123',
        email: 'headclerk@faculty-portal.local',
        full_name: 'Head Clerk',
        department: 'Office',
        role: 'officestaff',
        is_hod: false,
        is_registry: false,
        is_principal: false
      },
      {
        username: 'registry_office',
        password: 'password123',
        email: 'registry@faculty-portal.local',
        full_name: 'Registry Officer',
        department: 'Office',
        role: 'registry',
        is_hod: false,
        is_registry: true,
        is_principal: false
      },
      {
        username: 'principal',
        password: 'principal123',
        email: 'principal@faculty-portal.local',
        full_name: 'Principal',
        department: 'Administration',
        role: 'principal',
        is_hod: false,
        is_registry: false,
        is_principal: true
      },
      {
        username: 'hod_computer',
        password: 'password123',
        email: 'hod@faculty-portal.local',
        full_name: 'Dr. Sharvari Govilkar',
        department: 'Computer Engineering',
        role: 'hod',
        is_hod: true,
        is_registry: false,
        is_principal: false,
        managed_department: 'Computer Engineering'
      },
      {
        username: 'shrushti',
        password: 'password123',
        email: 'shrushti@faculty-portal.local',
        full_name: 'Shrushti',
        department: 'Computer Engineering',
        role: 'faculty',
        is_hod: false,
        is_registry: false,
        is_principal: false
      },
      {
        username: 'neha.ashok',
        password: 'password123',
        email: 'neha@faculty-portal.local',
        full_name: 'Prof. Neha Ashok',
        department: 'Computer Engineering',
        role: 'faculty',
        is_hod: false,
        is_registry: false,
        is_principal: false
      }
    ];

    console.log('🌱 Seeding users to Firestore...');

    for (const user of users) {
      try {
        const hash = bcrypt.hashSync(user.password, 10);
        const userRef = db.collection('users').doc(user.username);

        await userRef.set({
          username: user.username,
          password_hash: hash,
          email: user.email,
          full_name: user.full_name,
          department: user.department,
          role: user.role,
          designation: 'Faculty',
          phone_number: null,
          is_hod: user.is_hod,
          is_registry: user.is_registry,
          is_principal: user.is_principal,
          managed_department: user.managed_department || null,
          date_of_joining: null,
          medical_leave_total: 10,
          medical_leave_used: 0,
          medical_leave_left: 10,
          casual_leave_total: 10,
          casual_leave_used: 0,
          casual_leave_left: 10,
          earned_leave_total: 0,
          earned_leave_used: 0,
          earned_leave_left: 0,
          od_leave_count: 0,
          extended_medical_count: 0,
          maternity_paternity_total: 180,
          maternity_paternity_used: 0,
          maternity_paternity_left: 180,
          overwork_hours: 0,
          pending_overwork_hours: 0,
          summer_vacation_earned: 0,
          winter_vacation_earned: 0,
          total_vacation_earned: 0,
          created_at: new Date().toISOString(),
          deleted_at: null,
          delete_requested_at: null,
          deleted_by: null,
          restored_at: null,
          restored_by: null
        });

        console.log(`  ✓ Seeded: ${user.username}`);
      } catch (err) {
        console.error(`  ✗ Failed to seed ${user.username}:`, err.message);
      }
    }

    console.log('✓ Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedUsers();