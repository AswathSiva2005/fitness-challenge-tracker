const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect("mongodb://127.0.0.1:27017/fitness_tracker", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB');
    
    // Check if the progress collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const progressExists = collections.some(coll => coll.name === 'progress');
    
    console.log('\nCollections in database:');
    collections.forEach(coll => console.log(`- ${coll.name}`));
    
    if (progressExists) {
      console.log('\nProgress collection found. Checking for documents...');
      const Progress = mongoose.model('Progress', new mongoose.Schema({}));
      const count = await Progress.countDocuments();
      console.log(`Found ${count} progress documents`);
      
      if (count > 0) {
        console.log('\nSample progress document:');
        const sample = await Progress.findOne();
        console.log(JSON.stringify(sample, null, 2));
      }
    } else {
      console.log('\nProgress collection does not exist yet.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

testConnection();
