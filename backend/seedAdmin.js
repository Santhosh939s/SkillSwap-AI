const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const emailToPromote = process.argv[2];

if (!emailToPromote) {
    console.error('Please provide the email address to promote to superadmin.');
    console.error('Usage: node seedAdmin.js <email>');
    process.exit(1);
}

const promoteUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('MongoDB connected...');

        const user = await User.findOne({ email: emailToPromote.toLowerCase() });

        if (!user) {
            console.error(`User with email ${emailToPromote} not found in the database.`);
            process.exit(1);
        }

        user.role = 'superadmin';
        await user.save();

        console.log(`Success! User ${user.name} (${user.email}) has been promoted to superadmin.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

promoteUser();
