document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-btn');
    const themeToggle = document.getElementById('theme-toggle');
    
    // Check for saved theme preference or use preferred color scheme
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-theme');
    }
    
    // Toggle dark mode
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    });

    // Focus on input field when page loads
    userInput.focus();

    // Initialize conversation memory
    let conversationHistory = [];
    let userContext = {
        name: null,
        preferences: {},
        lastQuery: null,
        topicChain: []
    };

    // Knowledge base categories
    const knowledgeBase = {
        science: {
            physics: {
                'what is gravity': 'Gravity is a fundamental force that attracts objects with mass toward each other. On Earth, gravity gives weight to physical objects, and the Moon\'s gravity causes the ocean tides.',
                'explain quantum physics': 'Quantum physics is a branch of physics that deals with the behavior of matter and light on the atomic and subatomic scale. It describes nature at the smallest scales of energy levels of atoms and subatomic particles.',
                'what is relativity': 'Relativity is a theory developed by Albert Einstein that describes the laws of physics as observed by different observers who are moving relative to each other. It includes special relativity (1905) and general relativity (1915).',
                'what are black holes': 'Black holes are regions of spacetime where gravity is so strong that nothing—no particles or even electromagnetic radiation such as light—can escape from it. They form when massive stars collapse at the end of their life cycle.'
            },
            biology: {
                'what is dna': 'DNA (deoxyribonucleic acid) is a molecule that carries genetic instructions for the development, functioning, growth and reproduction of all known organisms and many viruses.',
                'explain evolution': 'Evolution is the process by which different kinds of living organisms developed from earlier forms during the history of the Earth. The theory of evolution by natural selection was proposed by Charles Darwin.',
                'what is photosynthesis': 'Photosynthesis is the process used by plants, algae and certain bacteria to convert light energy, normally from the Sun, into chemical energy that can be used to fuel the organisms\' activities.'
            },
            chemistry: {
                'what is an atom': 'An atom is the basic unit of a chemical element, consisting of a positively charged nucleus surrounded by negatively charged electrons. The nucleus contains protons and neutrons.',
                'explain periodic table': 'The periodic table is a tabular arrangement of chemical elements, organized by their atomic number, electron configuration, and recurring chemical properties. Elements are presented in order of increasing atomic number.'
            }
        },
        technology: {
            programming: {
                'what is javascript': 'JavaScript is a high-level, interpreted programming language that conforms to the ECMAScript specification. It is a language that is also characterized as dynamic, weakly typed, prototype-based and multi-paradigm.',
                'explain machine learning': 'Machine learning is a field of artificial intelligence that uses statistical techniques to give computer systems the ability to "learn" from data, without being explicitly programmed.',
                'what is an api': 'API (Application Programming Interface) is a set of rules that allows one software application to interact with another. APIs define the methods and data formats that applications can use to communicate with each other.'
            },
            internet: {
                'how does the internet work': 'The Internet works through a packet routing network that follows Internet Protocol (IP) and Transport Control Protocol (TCP). These protocols establish the rules for data exchange across the connected devices.',
                'what is cloud computing': 'Cloud computing is the delivery of computing services—including servers, storage, databases, networking, software, analytics, and intelligence—over the Internet ("the cloud") to offer faster innovation, flexible resources, and economies of scale.'
            },
            'artificial intelligence': {
                'what is ai': 'Artificial Intelligence (AI) refers to systems or machines that mimic human intelligence to perform tasks and can iteratively improve themselves based on the information they collect. AI manifests in various forms including chatbots, recommendation engines, facial recognition, and autonomous vehicles.',
                'what is deep learning': 'Deep learning is a subset of machine learning that uses neural networks with many layers (hence "deep") to analyze various factors of data. It is particularly powerful for processing unstructured data like text, images, and audio.',
                'what is natural language processing': 'Natural Language Processing (NLP) is a branch of AI that helps computers understand, interpret, and manipulate human language. NLP combines computational linguistics with machine learning and deep learning models.'
            }
        },
        philosophy: {
            'what is consciousness': 'Consciousness is the state of being aware of and able to perceive one\'s surroundings, thoughts, and feelings. The nature of consciousness remains one of the biggest mysteries in science and philosophy.',
            'explain existentialism': 'Existentialism is a philosophical theory that emphasizes individual existence, freedom, and choice. It holds that humans define their own meaning in life, and try to make rational decisions despite existing in an irrational universe.'
        },
        history: {
            'world war 2': 'World War II was a global war that lasted from 1939 to 1945. It involved the vast majority of the world\'s countries forming two opposing military alliances: the Allies and the Axis. It was the most widespread war in history, with more than 100 million people serving in military units.',
            'industrial revolution': 'The Industrial Revolution was the transition to new manufacturing processes in Europe and the United States, in the period from about 1760 to sometime between 1820 and 1840. This transition included going from hand production methods to machines, new chemical manufacturing and iron production processes, the increasing use of steam power, and the development of machine tools.'
        }
    };

    // Function to add a message to the chat
    function addMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', sender);
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message');
        messageContent.textContent = message;
        
        messageDiv.appendChild(messageContent);
        chatContainer.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Add to conversation history
        conversationHistory.push({
            role: sender,
            content: message,
            timestamp: new Date().toISOString()
        });

        // Limit history to last 20 messages to prevent memory issues
        if (conversationHistory.length > 20) {
            conversationHistory.shift();
        }
    }

    // Function to process user input and generate a response
    function processUserInput() {
        const userMessage = userInput.value.trim();
        
        if (userMessage === '') return;
        
        // Add user message to chat
        addMessage(userMessage, 'user');
        
        // Update user context
        userContext.lastQuery = userMessage;
        updateTopicChain(userMessage);
        
        // Clear input field
        userInput.value = '';
        
        // Generate bot response with typing effect
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('chat-message', 'bot', 'typing-indicator');
        typingIndicator.innerHTML = '<div class="message">Thinking...</div>';
        chatContainer.appendChild(typingIndicator);
        
        setTimeout(() => {
            // Remove typing indicator
            chatContainer.removeChild(typingIndicator);
            
            // Generate and display response
            const botResponse = generateResponse(userMessage);
            addMessage(botResponse, 'bot');
        }, 1000); // Longer delay to simulate more complex thinking
    }

    // Update the topic chain based on user input
    function updateTopicChain(userMessage) {
        // Extract potential topic from user message
        const potentialTopics = userMessage.toLowerCase().match(/\b(science|physics|biology|chemistry|technology|programming|internet|philosophy|history|ai|artificial intelligence)\b/g);
        
        if (potentialTopics && potentialTopics.length > 0) {
            // Add unique topics to the chain
            potentialTopics.forEach(topic => {
                if (!userContext.topicChain.includes(topic)) {
                    userContext.topicChain.push(topic);
                }
            });
            
            // Keep only the last 3 topics
            if (userContext.topicChain.length > 3) {
                userContext.topicChain = userContext.topicChain.slice(-3);
            }
        }
    }

    // Extract user name if provided
    function extractUserName(input) {
        const namePatterns = [
            /my name is (\w+)/i,
            /i am (\w+)/i,
            /call me (\w+)/i
        ];
        
        for (const pattern of namePatterns) {
            const match = input.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return null;
    }

    // Check if the input matches any knowledge base entries
    function checkKnowledgeBase(input) {
        input = input.toLowerCase();
        
        // First check for exact matches in our knowledge base
        for (const category in knowledgeBase) {
            if (typeof knowledgeBase[category] === 'object') {
                for (const subcategory in knowledgeBase[category]) {
                    if (typeof knowledgeBase[category][subcategory] === 'object') {
                        for (const question in knowledgeBase[category][subcategory]) {
                            if (input.includes(question)) {
                                return knowledgeBase[category][subcategory][question];
                            }
                        }
                    } else if (input.includes(subcategory)) {
                        return knowledgeBase[category][subcategory];
                    }
                }
            } else if (input.includes(category)) {
                return knowledgeBase[category];
            }
        }
        
        // If no exact match, check for keywords
        const keywords = input.split(' ');
        for (const keyword of keywords) {
            if (keyword.length < 4) continue; // Skip short words
            
            for (const category in knowledgeBase) {
                if (typeof knowledgeBase[category] === 'object') {
                    for (const subcategory in knowledgeBase[category]) {
                        if (typeof knowledgeBase[category][subcategory] === 'object') {
                            for (const question in knowledgeBase[category][subcategory]) {
                                if (question.includes(keyword)) {
                                    return `Based on your question about "${keyword}": ${knowledgeBase[category][subcategory][question]}`;
                                }
                            }
                        } else if (subcategory.includes(keyword)) {
                            return `Based on your interest in ${subcategory}: ${knowledgeBase[category][subcategory]}`;
                        }
                    }
                } else if (category.includes(keyword)) {
                    return `Based on your interest in ${category}: ${knowledgeBase[category]}`;
                }
            }
        }
        
        return null;
    }

    // Simple sentiment analysis function
    function analyzeSentiment(text) {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'like', 'best', 'fantastic', 'awesome', 'brilliant', 'perfect'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'hate', 'dislike', 'worst', 'poor', 'disappointing', 'frustrating', 'annoying'];
        
        let positiveScore = 0;
        let negativeScore = 0;
        
        const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveScore++;
            if (negativeWords.includes(word)) negativeScore++;
        });
        
        if (positiveScore > negativeScore) return 'positive';
        if (negativeScore > positiveScore) return 'negative';
        return 'neutral';
    }

    // Function to generate a response based on user input
    function generateResponse(userInput) {
        // Check for user name in input
        const userName = extractUserName(userInput);
        if (userName) {
            userContext.name = userName;
            return `Nice to meet you, ${userName}! How can I help you today?`;
        }
        
        // Convert to lowercase for pattern matching but keep original for context
        const input = userInput.toLowerCase();
        
        // Check if we have a knowledge base response
        const knowledgeResponse = checkKnowledgeBase(input);
        if (knowledgeResponse) {
            return knowledgeResponse;
        }
        
        // Check for follow-up questions
        if (input.match(/^(what|why|how|when|where|who|can you|could you|would you)/) && conversationHistory.length > 1) {
            const lastBotMessage = conversationHistory.filter(msg => msg.role === 'bot').pop();
            if (lastBotMessage) {
                // If the user is asking a follow-up about a topic we just discussed
                for (const topic of userContext.topicChain) {
                    if (lastBotMessage.content.toLowerCase().includes(topic)) {
                        return `Regarding ${topic}, I'd need more specific information to provide a detailed answer. Could you clarify what aspect of ${topic} you're interested in?`;
                    }
                }
            }
        }
        
        // Personal questions with context awareness
        if (input.match(/do you remember me|who am i/i) && userContext.name) {
            return `Of course I remember you, ${userContext.name}! How can I assist you today?`;
        }
        
        // Enhanced pattern matching for various queries
        
        // Greetings with context awareness
        if (input.match(/^(hi|hello|hey|howdy|hola)/)) {
            if (userContext.name) {
                return getRandomResponse([
                    `Hello again, ${userContext.name}! How can I help you today?`,
                    `Hi ${userContext.name}! What can I do for you?`,
                    `Hey ${userContext.name}! How can I assist you?`
                ]);
            } else {
                return getRandomResponse([
                    'Hello there! How can I help you today?',
                    'Hi! Nice to meet you. What can I do for you?',
                    'Hey! How can I assist you?'
                ]);
            }
        }
        
        // Asking how the bot is
        if (input.match(/how are you|how\'s it going|how are things/)) {
            return getRandomResponse([
                'I\'m functioning optimally, thanks for asking! How about you?',
                'I\'m doing well, thanks! How about you?',
                'All systems operational! I\'m ready to assist with any questions you might have.'
            ]);
        }
        // Farewell responses
        if (input.match(/bye|goodbye|see you|farewell/)) {
            return getRandomResponse([
                'Goodbye! Have a great day!',
                'See you later! Take care!',
                'Farewell! Feel free to return if you have more questions!'
            ]);
        }

        // Default response for unhandled queries
        return getRandomResponse([
            'I\'m not sure I understand. Could you rephrase that?',
            'I\'m still learning. Could you try asking that in a different way?',
            'I don\'t have enough information to answer that properly. Could you provide more details?'
        ]);
    }

    // Helper function to get random response from array
    function getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Event listeners
    sendButton.addEventListener('click', processUserInput);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            processUserInput();
        }
    });
});
