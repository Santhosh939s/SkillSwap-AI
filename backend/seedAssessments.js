const mongoose = require('mongoose');
require('dotenv').config();
const Assessment = require('./models/Assessment');
const AssessmentQuestion = require('./models/AssessmentQuestion');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected for seeding...');

        // Clear existing for clean slate
        await Assessment.deleteMany({});
        await AssessmentQuestion.deleteMany({});

        const reactAssessment = new Assessment({
            title: 'React Intermediate Certification',
            description: 'Test your knowledge on React Hooks, Context API, and advanced component patterns.',
            skill: 'React',
            difficulty: 'Medium',
            category: 'Frontend Development',
            passPercentage: 80,
            timeLimit: 10, // 10 minutes
            isPublished: true
        });

        await reactAssessment.save();

        const questions = [
            {
                assessmentId: reactAssessment._id,
                questionText: 'Which Hook is used to perform side effects in a function component?',
                type: 'Multiple Choice',
                options: ['useState', 'useEffect', 'useContext', 'useReducer'],
                correctAnswers: ['useEffect'],
                explanation: 'useEffect lets you perform side effects in function components.',
                points: 10,
                tags: ['hooks', 'basics']
            },
            {
                assessmentId: reactAssessment._id,
                questionText: 'What is the purpose of the useMemo hook?',
                type: 'Multiple Choice',
                options: ['To memoize a callback function', 'To memoize a calculated value', 'To access the DOM', 'To manage complex state'],
                correctAnswers: ['To memoize a calculated value'],
                explanation: 'useMemo returns a memoized value to avoid expensive calculations on every render.',
                points: 15,
                tags: ['hooks', 'performance']
            },
            {
                assessmentId: reactAssessment._id,
                questionText: 'Which of the following are valid ways to manage global state in React? (Select all that apply)',
                type: 'Multiple Select',
                options: ['Redux', 'Context API', 'useState in a deeply nested component', 'Zustand'],
                correctAnswers: ['Redux', 'Context API', 'Zustand'],
                explanation: 'useState in a deeply nested component does not provide global state.',
                points: 20,
                tags: ['state-management']
            },
            {
                assessmentId: reactAssessment._id,
                questionText: 'React uses a Virtual DOM to improve performance.',
                type: 'True/False',
                options: ['True', 'False'],
                correctAnswers: ['True'],
                explanation: 'React creates an in-memory data structure cache, computes the resulting differences, and then updates the browser displayed DOM efficiently.',
                points: 5,
                tags: ['architecture']
            },
            {
                assessmentId: reactAssessment._id,
                questionText: 'What is prop drilling?',
                type: 'Multiple Choice',
                options: [
                    'Passing props through multiple layers of components that do not need them',
                    'A way to securely drill holes in your motherboard',
                    'A feature of React Router',
                    'A method to optimize state updates'
                ],
                correctAnswers: ['Passing props through multiple layers of components that do not need them'],
                explanation: 'Prop drilling occurs when you pass data through nested components that don\'t actually need the data themselves.',
                points: 10,
                tags: ['architecture', 'anti-pattern']
            }
        ];

        await AssessmentQuestion.insertMany(questions);

        console.log('Assessments seeded successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
