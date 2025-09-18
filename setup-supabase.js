/**
 * Setup script to help configure Supabase for the Budget Planner
 * This script will guide you through the setup process
 */

const fs = require('fs');
const path = require('path');

function createEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), 'env.example');
  
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file already exists');
    return;
  }
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from env.example');
    console.log('📝 Please edit .env file with your Supabase credentials');
  } else {
    console.log('❌ env.example file not found');
  }
}

function showSetupInstructions() {
  console.log('\n🚀 Budget Planner - Supabase Setup Instructions');
  console.log('================================================\n');
  
  console.log('1. Create a Supabase project:');
  console.log('   • Go to https://supabase.com');
  console.log('   • Sign up/Login and create a new project');
  console.log('   • Choose a region close to your users\n');
  
  console.log('2. Get your Supabase credentials:');
  console.log('   • In your Supabase dashboard, go to Settings → API');
  console.log('   • Copy the Project URL and API keys\n');
  
  console.log('3. Configure your .env file:');
  console.log('   • Edit the .env file in your project root');
  console.log('   • Add your SUPABASE_URL and SUPABASE_ANON_KEY\n');
  
  console.log('4. Set up your database schema:');
  console.log('   • In Supabase dashboard, go to SQL Editor');
  console.log('   • Copy the contents of lib/database-schema-supabase.sql');
  console.log('   • Paste and run the SQL to create tables\n');
  
  console.log('5. Test your setup:');
  console.log('   • Run: npm run test:supabase');
  console.log('   • Start your app: npm start\n');
  
  console.log('📚 For detailed instructions, see SUPABASE_MIGRATION_GUIDE.md');
}

function main() {
  console.log('🔧 Setting up Budget Planner with Supabase...\n');
  
  createEnvFile();
  showSetupInstructions();
  
  console.log('✨ Setup complete! Follow the instructions above to configure Supabase.');
}

if (require.main === module) {
  main();
}

module.exports = { createEnvFile, showSetupInstructions };
