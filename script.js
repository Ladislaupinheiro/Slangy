document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÃO ---
    const API_KEYS = {
        GEMINI: "AIzaSyBga1AFoyuP9R6DPEQHef3uFM7FUSlzkDY"
    };

    // Lógica para carregar a preferência do tema
    if (localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Referências aos elementos HTML
    const mainContent = document.getElementById('mainContent');
    const explainerSection = document.getElementById('explainerSection');
    const flashcardSection = document.getElementById('flashcardSection');
    const gameSection = document.getElementById('gameSection');
    const profileSection = document.getElementById('profileSection');
    const slangInput = document.getElementById('slangInput');
    const searchButton = document.getElementById('searchButton');
    const randomSlangButton = document.getElementById('randomSlangButton');
    const viewFlashcardsButton = document.getElementById('viewFlashcardsButton');
    const startGameButton = document.getElementById('startGameButton');
    const viewProfileButton = document.getElementById('viewProfileButton');
    const backToExplainerButton = document.getElementById('backToExplainerButton');
    const backToExplainerFromGameButton = document.getElementById('backToExplainerFromGameButton');
    const backToExplainerFromProfileButton = document.getElementById('backToExplainerFromProfileButton');
    const themeToggleButton = document.getElementById('themeToggleButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    const slangCard = document.getElementById('slangCard');
    const slangTitle = document.getElementById('slangTitle');
    const slangContent = document.getElementById('slangContent');
    const tabContainer = document.getElementById('tabContainer');
    const tabButtons = document.querySelectorAll('#tabContainer button');

    const learningFeedback = document.getElementById('learningFeedback');
    const feedbackMessage = document.getElementById('feedbackMessage');
    const slangCountElement = document.getElementById('slangCount');
    const subheadingText = document.getElementById('subheadingText');
    const addFlashcardButton = document.getElementById('addFlashcardButton');
    
    // Flashcard UI
    const flashcardFlipper = document.getElementById('flashcardFlipper');
    const flashcardSlang = document.getElementById('flashcard-slang');
    const flashcardDefinition = document.getElementById('flashcard-definition');
    const prevFlashcardButton = document.getElementById('prevFlashcardButton');
    const nextFlashcardButton = document.getElementById('nextFlashcardButton');
    const flashcardCounter = document.getElementById('flashcardCounter');
    const emptyFlashcardsMessage = document.getElementById('emptyFlashcardsMessage');
    const flashcardControls = document.getElementById('flashcardControls');
    const flashcardDisplay = document.getElementById('flashcardDisplay');
    // Game UI
    const chatContainer = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');
    const sendChatButton = document.getElementById('sendChatButton');
    const targetSlangElement = document.getElementById('targetSlang');
    const gameErrorMessage = document.getElementById('gameErrorMessage');
    const gameErrorText = document.getElementById('gameErrorText');
    // Profile UI
    const profileUserId = document.getElementById('profileUserId');
    const profileLearnedCount = document.getElementById('profileLearnedCount');
    const profileFlashcardCount = document.getElementById('profileFlashcardCount');
    const profileSlangList = document.getElementById('profileSlangList');
    const profileEmptyMessage = document.getElementById('profileEmptyMessage');
    
    // Variáveis globais
    let flashcardsDeck = JSON.parse(localStorage.getItem('flashcardsDeck')) || [];
    let currentFlashcardIndex = 0;
    let currentGameSlang = null;
    const learnedSlangs = new Set(JSON.parse(localStorage.getItem('learnedSlangs') || '[]'));
    let slangCount = learnedSlangs.size;
    const userId = localStorage.getItem('userId') || crypto.randomUUID();
    localStorage.setItem('userId', userId);

    // Lista de gírias para a funcionalidade aleatória
    const slangs = [
        'lowkey', 'highkey', 'woke', 'flex', 'lit', 'cap', 'ghosting',
        'rizz', 'bet', 'slay', 'drip', 'vibe check', 'boujee', 'simp',
        'squad', 'fam', 'fit', 'tea', 'ship', 'stan', 'glow up', 'salty',
        'extra', 'sus', 'no cap', 'periodt', 'basic', 'clout',
        'finna', 'yeet', 'oof', 'squad goals', 'FOMO', 'JOMO', 'savage',
        'sksksk'
    ];
    let lastSlang = null;
    let chatHistory = [];
    // --- INICIALIZAÇÃO ---
    slangCountElement.textContent = slangCount;

    // --- EVENT LISTENERS ---

    searchButton.addEventListener('click', explainSlang);
    slangInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            explainSlang();
        }
    });
    randomSlangButton.addEventListener('click', () => {
        if (slangs.length === 0) {
            showError("A lista de gírias está vazia.");
            return;
        }
        let randomSlang;
        do {
            randomSlang = slangs[Math.floor(Math.random() * slangs.length)];
        } while (randomSlang === lastSlang && slangs.length > 1);
        
        lastSlang = randomSlang;
        slangInput.value = randomSlang;
        explainSlang();
    });
    themeToggleButton.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    addFlashcardButton.addEventListener('click', () => {
        if (window.slangData) {
            addSlangToFlashcards(window.slangData);
        }
    });

    // Navegação entre seções
    viewFlashcardsButton.addEventListener('click', () => {
        showSection('flashcardSection');
        renderFlashcard();
    });
    startGameButton.addEventListener('click', () => {
        if (flashcardsDeck.length === 0) {
            showLearningFeedback('Adicione gírias aos flashcards para começar a jogar!');
            return;
        }
        showSection('gameSection');
        startNewGameRound();
    });
    viewProfileButton.addEventListener('click', () => {
        showSection('profileSection');
        updateProfileInfo();
    });
    backToExplainerButton.addEventListener('click', () => showSection('explainerSection'));
    backToExplainerFromGameButton.addEventListener('click', () => showSection('explainerSection'));
    backToExplainerFromProfileButton.addEventListener('click', () => showSection('explainerSection'));
    // Controles do Jogo
    sendChatButton.addEventListener('click', handleUserResponse);
    chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            handleUserResponse();
        }
    });
    // Controles dos Flashcards
    flashcardFlipper.addEventListener('click', () => {
        flashcardFlipper.querySelector('.flipper').classList.toggle('flipped');
    });
    nextFlashcardButton.addEventListener('click', () => {
        if (flashcardsDeck.length > 0) {
            currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcardsDeck.length;
            renderFlashcard();
        }
    });
    prevFlashcardButton.addEventListener('click', () => {
        if (flashcardsDeck.length > 0) {
            currentFlashcardIndex = (currentFlashcardIndex - 1 + flashcardsDeck.length) % flashcardsDeck.length;
            renderFlashcard();
        }
    });
    // Navegação por Tabs
    tabContainer.addEventListener('click', (event) => {
        const targetTab = event.target.closest('button[data-tab]');
        if (targetTab && window.slangData) {
            const tabName = targetTab.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('border-yellow-300', 'text-yellow-300'));
            targetTab.classList.add('border-yellow-300', 'text-yellow-300');
            updateSlangContent(window.slangData, tabName);
        }
    });
    
    // --- FUNÇÕES PRINCIPAIS ---

    function showSection(sectionId) {
        // Esconde todas as seções
        [explainerSection, flashcardSection, gameSection, profileSection].forEach(section => {
            section.classList.add('hidden');
        });
        // Mostra a seção desejada
        document.getElementById(sectionId).classList.remove('hidden');
        // Ajustes de UI específicos para cada seção
        const isGameSection = sectionId === 'gameSection';
        mainContent.classList.toggle('p-0', isGameSection);
        mainContent.classList.toggle('p-8', !isGameSection);
        mainContent.classList.toggle('md:p-12', !isGameSection);
        subheadingText.classList.toggle('hidden', isGameSection);
        slangCountElement.parentElement.classList.toggle('hidden', isGameSection);
        // Atualiza o subtítulo
        switch (sectionId) {
            case 'explainerSection':
                subheadingText.textContent = 'Desbloqueie a fluência em gírias americanas.';
                break;
            case 'flashcardSection':
                subheadingText.textContent = 'Revisa as tuas gírias guardadas!';
                break;
            case 'profileSection':
                subheadingText.textContent = 'Confere o teu progresso!';
                break;
        }
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
    }
    function hideError() {
        errorMessage.classList.add('hidden');
    }
    function showGameError(message) {
        gameErrorText.textContent = message;
        gameErrorMessage.classList.remove('hidden');
    }
    function hideGameError() {
        gameErrorMessage.classList.add('hidden');
    }

    function addSlangToFlashcards(slangData) {
        const exists = flashcardsDeck.some(item => item.slang.toLowerCase() === slangData.slang.toLowerCase());
        if (!exists) {
            flashcardsDeck.push(slangData);
            localStorage.setItem('flashcardsDeck', JSON.stringify(flashcardsDeck));
            showLearningFeedback(`'${slangData.slang}' adicionada aos flashcards!`);
        } else {
            showLearningFeedback(`'${slangData.slang}' já está nos teus flashcards.`);
        }
    }

    function renderFlashcard() {
        const hasFlashcards = flashcardsDeck.length > 0;
    
        emptyFlashcardsMessage.classList.toggle('hidden', hasFlashcards);
        flashcardDisplay.classList.toggle('hidden', !hasFlashcards);
        flashcardControls.classList.toggle('hidden', !hasFlashcards);
    
        if (hasFlashcards) {
            flashcardFlipper.querySelector('.flipper').classList.remove('flipped');
            const currentSlang = flashcardsDeck[currentFlashcardIndex];
            
            flashcardSlang.textContent = currentSlang.slang;
            flashcardDefinition.textContent = currentSlang.definition;
            flashcardCounter.textContent = `${currentFlashcardIndex + 1} / ${flashcardsDeck.length}`;
        } else {
            // Garante que o contador esteja correto quando não há flashcards
            flashcardCounter.textContent = "0 / 0";
        }
    }

    function startNewGameRound() {
        hideGameError();
        chatInput.value = '';
        chatInput.disabled = false;
        chatContainer.innerHTML = '';
        chatHistory = []; 
        
        const selectedSlangData = flashcardsDeck[Math.floor(Math.random() * flashcardsDeck.length)];
        currentGameSlang = selectedSlangData.slang;
        targetSlangElement.textContent = currentGameSlang;
        
        const initialPrompt = `Let's have a short, friendly chat. Your goal is to get me to use the slang term "${currentGameSlang}" naturally in a sentence. Start the conversation.`;
        addMessageToChat("Hey! Let's chat for a bit.", 'ai');
        chatHistory.push({ role: 'user', parts: [{ text: initialPrompt }] });
        chatHistory.push({ role: 'model', parts: [{ text: "Hey! Let's chat for a bit." }] });
    }

    function addMessageToChat(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', sender);
        messageDiv.textContent = text;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function handleUserResponse() {
        const userText = chatInput.value.trim();
        if (!userText) return;

        addMessageToChat(userText, 'user');
        chatInput.value = '';
        chatInput.disabled = true;
        
        chatHistory.push({ role: 'user', parts: [{ text: userText }] });
        if (userText.toLowerCase().includes(currentGameSlang.toLowerCase())) {
            showLearningFeedback('Excellent! You used the slang correctly!');
            setTimeout(startNewGameRound, 2500);
        } else {
            await generateAiResponse();
        }
    }

    async function generateAiResponse() {
        const apiKey = API_KEYS.GEMINI;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        
        const payload = { contents: chatHistory };
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            const result = await response.json();
            const aiResponseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (aiResponseText) {
                addMessageToChat(aiResponseText, 'ai');
                chatHistory.push({ role: 'model', parts: [{ text: aiResponseText }] });
            } else {
                throw new Error("Resposta da IA inválida.");
            }
        } catch (error) {
            console.error('Error generating AI response:', error);
            showGameError('Oops! I couldn\'t generate a response. Let\'s try a new round.');
            setTimeout(startNewGameRound, 2500);
        } finally {
            chatInput.disabled = false;
            chatInput.focus();
        }
    }

    function updateProfileInfo() {
        profileUserId.textContent = `ID de Utilizador: ${userId}`;
        profileLearnedCount.textContent = learnedSlangs.size;
        profileFlashcardCount.textContent = flashcardsDeck.length;

        profileSlangList.innerHTML = '';
        const hasFlashcards = flashcardsDeck.length > 0;

        profileEmptyMessage.classList.toggle('hidden', hasFlashcards);
        if (hasFlashcards) {
            flashcardsDeck.forEach(slang => {
                const li = document.createElement('li');
                li.textContent = slang.slang;
                li.classList.add('bg-gray-600', 'p-3', 'rounded-lg', 'shadow-sm', 'text-gray-200');
                profileSlangList.appendChild(li);
            });
        }
    }
    
    function showLearningFeedback(message) {
        feedbackMessage.textContent = message;
        learningFeedback.classList.remove('hidden', 'animate-fade-out');
        learningFeedback.classList.add('animate-pop-in-bounce');
        
        setTimeout(() => {
            learningFeedback.classList.remove('animate-pop-in-bounce');
            learningFeedback.classList.add('animate-fade-out');
            
            const onAnimationEnd = () => {
                learningFeedback.classList.add('hidden');
                learningFeedback.removeEventListener('animationend', onAnimationEnd);
            };
            learningFeedback.addEventListener('animationend', onAnimationEnd);
            
        }, 4000);
    }
    
    async function explainSlang() {
        const slang = slangInput.value.trim().toLowerCase();
        if (!slang) return;
    
        hideError();
        loadingIndicator.classList.remove('hidden');
        slangCard.classList.add('hidden');
        slangContent.innerHTML = '';
        
        const apiKey = API_KEYS.GEMINI;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        
        try {
            const payload = {
                contents: [{
                    parts: [{ text: `Explain the slang term "${slang}" in Portuguese. Structure the response as a JSON object with keys: "slang", "definition", "examples" (an array of 3 objects, each with "phrase" in English and "translation" in Portuguese), and "context".` }]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                }
            };
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    
            const result = await response.json();
            const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!responseText) throw new Error('A API não retornou uma resposta válida.');
    
            let slangData;
            try {
                slangData = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Erro ao analisar JSON da IA:", responseText);
                throw new Error("A resposta da IA não estava no formato esperado.");
            }
    
            if (!slangData.slang || !slangData.definition) {
                 throw new Error('Os dados recebidos da IA estão incompletos.');
            }
    
            window.slangData = slangData;
            slangCard.classList.remove('hidden');
            slangTitle.textContent = slangData.slang;
            
            tabButtons.forEach(btn => btn.classList.remove('border-yellow-300', 'text-yellow-300'));
            document.getElementById('tab-definicao').classList.add('border-yellow-300', 'text-yellow-300');
            
            updateSlangContent(slangData, 'definicao');
            if (!learnedSlangs.has(slangData.slang.toLowerCase())) {
                learnedSlangs.add(slangData.slang.toLowerCase());
                localStorage.setItem('learnedSlangs', JSON.stringify([...learnedSlangs]));
                slangCount = learnedSlangs.size;
                slangCountElement.textContent = slangCount;
                showLearningFeedback(`Parabéns! Agora você entende '${slangData.slang}'.`);
            }
    
        } catch (error) {
            console.error('Erro ao buscar a gíria:', error);
            showError(error.message || 'Houve um erro. Verifique sua conexão ou a gíria e tente novamente.');
        } finally {
            loadingIndicator.classList.add('hidden');
        }
    }

    function updateSlangContent(data, tab) {
        let contentHTML = '';
        switch (tab) {
            case 'definicao':
                contentHTML = `<p class="text-gray-400">${data.definition}</p>`;
                break;
            case 'exemplos':
                contentHTML = '<ul class="space-y-4">';
                if (Array.isArray(data.examples)) {
                    data.examples.forEach(example => {
                        contentHTML += `
                            <li class="p-4 bg-gray-600 rounded-xl flex flex-col shadow-sm animate-slide-in-right">
                                <div class="flex items-center justify-between">
                                    <p class="text-white font-bold">${example.phrase}</p>
                                </div>
                                <p class="text-gray-300 italic mt-2">${example.translation}</p>
                            </li>
                        `;
                    });
                }
                contentHTML += '</ul>';
                break;
            case 'contexto':
                contentHTML = `<p class="text-gray-400">${data.context}</p>`;
                break;
        }
        slangContent.innerHTML = contentHTML;
    }

});

