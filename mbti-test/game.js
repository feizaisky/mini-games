// MBTI 测试问题
const questions = [
    {
        text: "在社交聚会中，你通常会：",
        options: [
            { text: "主动与很多人交谈，享受热闹氛围", scores: { E: 2, I: 0 } },
            { text: "与少数熟人聊天，感到更自在", scores: { E: 0, I: 2 } }
        ]
    },
    {
        text: "当你需要做决定时，你更倾向于：",
        options: [
            { text: "依靠逻辑分析和客观事实", scores: { T: 2, F: 0 } },
            { text: "考虑个人价值观和他人感受", scores: { T: 0, F: 2 } }
        ]
    },
    {
        text: "在处理任务时，你喜欢：",
        options: [
            { text: "制定详细计划，按步骤执行", scores: { J: 2, P: 0 } },
            { text: "灵活应对，随机应变", scores: { J: 0, P: 2 } }
        ]
    },
    {
        text: "面对新信息，你更关注：",
        options: [
            { text: "具体的细节和现实情况", scores: { S: 2, N: 0 } },
            { text: "整体的概念和未来可能性", scores: { S: 0, N: 2 } }
        ]
    },
    {
        text: "在周末休息时，你更喜欢：",
        options: [
            { text: "外出活动，和朋友聚会", scores: { E: 2, I: 0 } },
            { text: "在家独处，看书或做喜欢的事", scores: { E: 0, I: 2 } }
        ]
    },
    {
        text: "当朋友遇到困难时，你会：",
        options: [
            { text: "提供实际解决方案和 建议", scores: { T: 2, F: 0 } },
            { text: "给予情感支持和安慰", scores: { T: 0, F: 2 } }
        ]
    },
    {
        text: "你的工作方式更倾向于：",
        options: [
            { text: "按时完成，不喜欢拖延", scores: { J: 2, P: 0 } },
            { text: "在最后时刻前保持灵活", scores: { J: 0, P: 2 } }
        ]
    },
    {
        text: "在学习新事物时，你偏好：",
        options: [
            { text: "从实际案例和经验入手", scores: { S: 2, N: 0 } },
            { text: "理解理论框架和概念", scores: { S: 0, N: 2 } }
        ]
    },
    {
        text: "在团队讨论中，你通常是：",
        options: [
            { text: "率先表达自己的观点", scores: { E: 2, I: 0 } },
            { text: "先听取他人意见再发言", scores: { E: 0, I: 2 } }
        ]
    },
    {
        text: "做决定时，你更看重：",
        options: [
            { text: "公平原则和逻辑一致性", scores: { T: 2, F: 0 } },
            { text: "和谐关系和他人感受", scores: { T: 0, F: 2 } }
        ]
    },
    {
        text: "面对截止日期，你会：",
        options: [
            { text: "提前完成，避免最后时刻的压力", scores: { J: 2, P: 0 } },
            { text: "在压力下激发效率", scores: { J: 0, P: 2 } }
        ]
    },
    {
        text: "你对未来的规划更倾向于：",
        options: [
            { text: "关注当前和现实需求", scores: { S: 2, N: 0 } },
            { text: "憧憬未来的可能性", scores: { S: 0, N: 2 } }
        ]
    }
];

// MBTI 人格类型描述
const personalityTypes = {
    'ISTJ': {
        name: '物流师',
        desc: '务实、实际、注重事实。可靠、值得信赖，重视传统和忠诚。',
        traits: ['内向', '实感', '思考', '判断']
    },
    'ISFJ': {
        name: '守卫者',
        desc: '温暖、体贴、有责任感。关心他人，注重和谐，乐于助人。',
        traits: ['内向', '实感', '情感', '判断']
    },
    'INFJ': {
        name: '提倡者',
        desc: '理想主义、深邃、有洞察力。追求意义和价值，富有同理心。',
        traits: ['内向', '直觉', '情感', '判断']
    },
    'INTJ': {
        name: '建筑师',
        desc: '战略思维、独立、追求效率。有远见，喜欢系统化思考。',
        traits: ['内向', '直觉', '思考', '判断']
    },
    'ISTP': {
        name: '鉴赏家',
        desc: '灵活、冷静、注重实践。擅长解决问题，喜欢动手操作。',
        traits: ['内向', '实感', '思考', '感知']
    },
    'ISFP': {
        name: '探险家',
        desc: '温和、敏感、艺术气质。重视个人价值观，活在当下。',
        traits: ['内向', '实感', '情感', '感知']
    },
    'INFP': {
        name: '调停者',
        desc: '理想主义、真诚、富有想象力。追求和谐，重视真实性。',
        traits: ['内向', '直觉', '情感', '感知']
    },
    'INTP': {
        name: '逻辑学家',
        desc: '分析、独立、追求知识。喜欢理论和抽象概念，思维敏捷。',
        traits: ['内向', '直觉', '思考', '感知']
    },
    'ESTP': {
        name: '企业家',
        desc: '活跃、现实、适应力强。喜欢行动和冒险，活在当下。',
        traits: ['外向', '实感', '思考', '感知']
    },
    'ESFP': {
        name: '表演者',
        desc: '热情、友好、热爱生活。喜欢与人互动，注重体验。',
        traits: ['外向', '实感', '情感', '感知']
    },
    'ENFP': {
        name: '竞选者',
        desc: '热情、富有想象力、善于沟通。追求可能性，激励他人。',
        traits: ['外向', '直觉', '情感', '感知']
    },
    'ENTP': {
        name: '辩论家',
        desc: '机智、创新、喜欢挑战。思维敏捷，热爱智力游戏。',
        traits: ['外向', '直觉', '思考', '感知']
    },
    'ESTJ': {
        name: '总经理',
        desc: '务实、组织力强、果断。重视效率和结果，天生的领导者。',
        traits: ['外向', '实感', '思考', '判断']
    },
    'ESFJ': {
        name: '执政官',
        desc: '热情、体贴、有责任感。关心他人，喜欢帮助和组织。',
        traits: ['外向', '实感', '情感', '判断']
    },
    'ENFJ': {
        name: '主人公',
        desc: '富有魅力、鼓舞人心、有同理心。善于理解他人，促进成长。',
        traits: ['外向', '直觉', '情感', '判断']
    },
    'ENTJ': {
        name: '指挥官',
        desc: '果断、领导力强、追求效率。有远见，喜欢挑战和成就。',
        traits: ['外向', '直觉', '思考', '判断']
    }
};

// 游戏状态
let currentQuestion = 0;
let scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

// DOM 元素
const questionCard = document.getElementById('questionCard');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const progressFill = document.getElementById('progressFill');
const resultCard = document.getElementById('resultCard');
const resultType = document.getElementById('resultType');
const resultName = document.getElementById('resultName');
const resultDesc = document.getElementById('resultDesc');
const resultTraits = document.getElementById('resultTraits');
const restartBtn = document.getElementById('restartBtn');

// 初始化测试
function initTest() {
    currentQuestion = 0;
    scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    showQuestion();
}

// 显示问题
function showQuestion() {
    if (currentQuestion >= questions.length) {
        showResult();
        return;
    }

    const question = questions[currentQuestion];
    questionText.textContent = `${currentQuestion + 1}. ${question.text}`;

    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option.text;
        btn.onclick = () => selectOption(option);
        optionsContainer.appendChild(btn);
    });

    updateProgress();
}

// 选择选项
function selectOption(option) {
    // 累加分数
    for (let dimension in option.scores) {
        scores[dimension] += option.scores[dimension];
    }

    currentQuestion++;
    showQuestion();
}

// 更新进度条
function updateProgress() {
    const progress = (currentQuestion / questions.length) * 100;
    progressFill.style.width = progress + '%';
}

// 计算结果
function calculateResult() {
    const E_I = scores.E > scores.I ? 'E' : 'I';
    const S_N = scores.S > scores.N ? 'S' : 'N';
    const T_F = scores.T > scores.F ? 'T' : 'F';
    const J_P = scores.J > scores.P ? 'J' : 'P';

    return E_I + S_N + T_F + J_P;
}

// 显示结果
function showResult() {
    questionCard.style.display = 'none';
    resultCard.style.display = 'block';
    restartBtn.style.display = 'inline-block';

    const type = calculateResult();
    const result = personalityTypes[type];

    resultType.textContent = type;
    resultName.textContent = result.name;
    resultDesc.textContent = result.desc;

    resultTraits.innerHTML = result.traits.map(trait =>
        `<span class="trait-tag">${trait}</span>`
    ).join('');
}

// 重新测试
restartBtn.addEventListener('click', () => {
    resultCard.style.display = 'none';
    restartBtn.style.display = 'none';
    questionCard.style.display = 'flex';
    initTest();
});

// 开始测试
initTest();
