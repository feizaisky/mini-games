// MBTI 测试 120 道题库（每个维度 30 题）
const allQuestions = [
    // E/I 维度（外向/内向）
    { text: "在社交聚会中，你通常会：", options: [
        { text: "主动与很多人交谈，享受热闹氛围", scores: { E: 2, I: 0 } },
        { text: "与少数熟人聊天，感到更自在", scores: { E: 0, I: 2 } }
    ]},
    { text: "周末休息时，你更倾向于：", options: [
        { text: "外出活动，和朋友聚会", scores: { E: 2, I: 0 } },
        { text: "在家独处，看书或做喜欢的事", scores: { E: 0, I: 2 } }
    ]},
    { text: "在团队讨论中，你通常是：", options: [
        { text: "率先表达自己的观点", scores: { E: 2, I: 0 } },
        { text: "先听取他人意见再发言", scores: { E: 0, I: 2 } }
    ]},
    { text: "当你需要充电时，你会：", options: [
        { text: "和朋友聚会聊天", scores: { E: 2, I: 0 } },
        { text: "独自休息，享受安静时光", scores: { E: 0, I: 2 } }
    ]},
    { text: "在陌生环境中，你更愿意：", options: [
        { text: "主动结识新朋友", scores: { E: 2, I: 0 } },
        { text: "观察等待他人接近", scores: { E: 0, I: 2 } }
    ]},
    { text: "你的沟通方式更像是：", options: [
        { text: "边想边说，热情表达", scores: { E: 2, I: 0 } },
        { text: "先思考再表达", scores: { E: 0, I: 2 } }
    ]},
    { text: "在公共场合，你通常：", options: [
        { text: "成为关注的焦点", scores: { E: 2, I: 0 } },
        { text: "保持低调，观察周围", scores: { E: 0, I: 2 } }
    ]},
    { text: "当你需要专注工作时，你会：", options: [
        { text: "在有人陪伴的环境中也能专注", scores: { E: 2, I: 0 } },
        { text: "需要独处才能集中注意力", scores: { E: 0, I: 2 } }
    ]},
    { text: "你的朋友圈子：", options: [
        { text: "广泛，有很多朋友", scores: { E: 2, I: 0 } },
        { text: "精简，但关系深厚", scores: { E: 0, I: 2 } }
    ]},
    { text: "遇到问题时，你更倾向于：", options: [
        { text: "找人讨论，通过交流理清思路", scores: { E: 2, I: 0 } },
        { text: "独自思考，内化消化", scores: { E: 0, I: 2 } }
    ]},
    { text: "在聚会上，你通常会：", options: [
        { text: "主动介绍自己给新人", scores: { E: 2, I: 0 } },
        { text: "等待别人来介绍", scores: { E: 0, I: 2 } }
    ]},
    { text: "你的能量来源是：", options: [
        { text: "与他人的互动", scores: { E: 2, I: 0 } },
        { text: "独处的反思时光", scores: { E: 0, I: 2 } }
    ]},
    { text: "当有重要决定时，你：", options: [
        { text: "会告诉他人并寻求意见", scores: { E: 2, I: 0 } },
        { text: "先自己想清楚再分享", scores: { E: 0, I: 2 } }
    ]},
    { text: "你的工作风格更倾向于：", options: [
        { text: "团队合作，经常交流", scores: { E: 2, I: 0 } },
        { text: "独立工作，深入思考", scores: { E: 0, I: 2 } }
    ]},
    { text: "在学习新技能时，你喜欢：", options: [
        { text: "与他人一起学习讨论", scores: { E: 2, I: 0 } },
        { text: "独自研究琢磨", scores: { E: 0, I: 2 } }
    ]},
    { text: "你的性格更像是：", options: [
        { text: "热情开放，表达丰富", scores: { E: 2, I: 0 } },
        { text: "深沉内敛，思考深入", scores: { E: 0, I: 2 } }
    ]},
    { text: "面对人群，你通常：", options: [
        { text: "感到兴奋和活力", scores: { E: 2, I: 0 } },
        { text: "感到消耗，需要休息", scores: { E: 0, I: 2 } }
    ]},
    { text: "你的思考方式是：", options: [
        { text: "通过交谈整理思绪", scores: { E: 2, I: 0 } },
        { text: "在内心反复思考", scores: { E: 0, I: 2 } }
    ]},
    { text: "在会议上，你：", options: [
        { text: "积极发言参与讨论", scores: { E: 2, I: 0 } },
        { text: "认真倾听，选择性发言", scores: { E: 0, I: 2 } }
    ]},
    { text: "你的社交策略是：", options: [
        { text: "广交朋友，扩大人脉", scores: { E: 2, I: 0 } },
        { text: "保持联系，重质不重量", scores: { E: 0, I: 2 } }
    ]},
    { text: "下班后，你更想：", options: [
        { text: "和朋友一起吃饭聊天", scores: { E: 2, I: 0 } },
        { text: "回家休息，享受个人时间", scores: { E: 0, I: 2 } }
    ]},
    { text: "在陌生地方，你会：", options: [
        { text: "主动探索和融入", scores: { E: 2, I: 0 } },
        { text: "观察适应，谨慎行动", scores: { E: 0, I: 2 } }
    ]},
    { text: "你的表达方式：", options: [
        { text: "流畅自然，随想随说", scores: { E: 2, I: 0 } },
        { text: "谨慎思考后再表达", scores: { E: 0, I: 2 } }
    ]},
    { text: "在团队中，你更喜欢：", options: [
        { text: "开放讨论，头脑风暴", scores: { E: 2, I: 0 } },
        { text: "独立思考后提出建议", scores: { E: 0, I: 2 } }
    ]},
    { text: "你的影响力来源于：", options: [
        { text: "个人魅力和社交能力", scores: { E: 2, I: 0 } },
        { text: "深度思考和专业知识", scores: { E: 0, I: 2 } }
    ]},
    { text: "面对冲突，你会：", options: [
        { text: "直接沟通，当面解决", scores: { E: 2, I: 0 } },
        { text: "先思考，再选择时机沟通", scores: { E: 0, I: 2 } }
    ]},
    { text: "你的朋友圈更新频率：", options: [
        { text: "经常分享生活动态", scores: { E: 2, I: 0 } },
        { text: "偶尔分享，更多是浏览", scores: { E: 0, I: 2 } }
    ]},
    { text: "你在人群中通常：", options: [
        { text: "主动带动气氛", scores: { E: 2, I: 0 } },
        { text: "安静观察，偶尔互动", scores: { E: 0, I: 2 } }
    ]},
    { text: "你的理想工作环境：", options: [
        { text: "开放活跃，互动频繁", scores: { E: 2, I: 0 } },
        { text: "安静独立，专注深入", scores: { E: 0, I: 2 } }
    ]},
    { text: "遇到挫折时，你更愿意：", options: [
        { text: "找人倾诉，寻求支持", scores: { E: 2, I: 0 } },
        { text: "独处消化，自我调节", scores: { E: 0, I: 2 } }
    ]},
    { text: "你的领导风格：", options: [
        { text: "参与式，善于激励", scores: { E: 2, I: 0 } },
        { text: "指导式，注重效率", scores: { E: 0, I: 2 } }
    ]},
    { text: "在派对上，你通常会：", options: [
        { text: "从一个圈子移动到另一个", scores: { E: 2, I: 0 } },
        { text: "和固定的小圈子深入交流", scores: { E: 0, I: 2 } }
    ]},
    { text: "接到陌生电话时，你更倾向于：", options: [
        { text: "轻松交流，乐于寒暄", scores: { E: 2, I: 0 } },
        { text: "直奔主题，尽快结束", scores: { E: 0, I: 2 } }
    ]},
    { text: "参加培训时，你更喜欢：", options: [
        { text: "小组讨论和互动环节", scores: { E: 2, I: 0 } },
        { text: "个人阅读和独立思考", scores: { E: 0, I: 2 } }
    ]},

    // S/N 维度（实感/直觉）
    { text: "面对新信息，你更关注：", options: [
        { text: "具体的细节和现实情况", scores: { S: 2, N: 0 } },
        { text: "整体的概念和未来可能性", scores: { S: 0, N: 2 } }
    ]},
    { text: "在学习新事物时，你偏好：", options: [
        { text: "从实际案例和经验入手", scores: { S: 2, N: 0 } },
        { text: "理解理论框架和概念", scores: { S: 0, N: 2 } }
    ]},
    { text: "你对未来的规划更倾向于：", options: [
        { text: "关注当前和现实需求", scores: { S: 2, N: 0 } },
        { text: "憧憬未来的可能性", scores: { S: 0, N: 2 } }
    ]},
    { text: "在解决问题时，你更信任：", options: [
        { text: "过往经验和已知方法", scores: { S: 2, N: 0 } },
        { text: "直觉和创新思路", scores: { S: 0, N: 2 } }
    ]},
    { text: "你喜欢阅读的内容：", options: [
        { text: "实际应用和具体事实", scores: { S: 2, N: 0 } },
        { text: "理论和抽象概念", scores: { S: 0, N: 2 } }
    ]},
    { text: "在工作中，你更注重：", options: [
        { text: "细节和实际操作", scores: { S: 2, N: 0 } },
        { text: "宏观策略和愿景", scores: { S: 0, N: 2 } }
    ]},
    { text: "你对抽象概念的接受度：", options: [
        { text: "更倾向具体可操作的内容", scores: { S: 2, N: 0 } },
        { text: "喜欢探索抽象理论", scores: { S: 0, N: 2 } }
    ]},
    { text: "在做计划时，你会：", options: [
        { text: "列出具体步骤和时间表", scores: { S: 2, N: 0 } },
        { text: "制定大致方向和目标", scores: { S: 0, N: 2 } }
    ]},
    { text: "你更相信：", options: [
        { text: "确凿的数据和事实", scores: { S: 2, N: 0 } },
        { text: "直觉和灵感", scores: { S: 0, N: 2 } }
    ]},
    { text: "面对变化，你关注：", options: [
        { text: "具体的改变和实际影响", scores: { S: 2, N: 0 } },
        { text: "变化背后的意义和趋势", scores: { S: 0, N: 2 } }
    ]},
    { text: "你喜欢：", options: [
        { text: "脚踏实地，从现在做起", scores: { S: 2, N: 0 } },
        { text: "仰望星空，想象未来", scores: { S: 0, N: 2 } }
    ]},
    { text: "在讨论中，你更倾向于：", options: [
        { text: "谈论具体事例和数据", scores: { S: 2, N: 0 } },
        { text: "讨论想法和可能性", scores: { S: 0, N: 2 } }
    ]},
    { text: "你的思维模式：", options: [
        { text: "归纳法，从细节到整体", scores: { S: 2, N: 0 } },
        { text: "演绎法，从原理到应用", scores: { S: 0, N: 2 } }
    ]},
    { text: "对艺术作品，你更看重：", options: [
        { text: "技巧和表现形式", scores: { S: 2, N: 0 } },
        { text: "表达的内涵和情感", scores: { S: 0, N: 2 } }
    ]},
    { text: "在购物时，你更关注：", options: [
        { text: "产品的实际功能和参数", scores: { S: 2, N: 0 } },
        { text: "产品的设计理念和品牌故事", scores: { S: 0, N: 2 } }
    ]},
    { text: "你更擅长：", options: [
        { text: "执行具体任务", scores: { S: 2, N: 0 } },
        { text: "制定战略规划", scores: { S: 0, N: 2 } }
    ]},
    { text: "面对复杂的系统，你：", options: [
        { text: "从各个组成部分入手理解", scores: { S: 2, N: 0 } },
        { text: "从整体架构入手把握", scores: { S: 0, N: 2 } }
    ]},
    { text: "你更相信：", options: [
        { text: "过去的经验教训", scores: { S: 2, N: 0 } },
        { text: "未来的可能性", scores: { S: 0, N: 2 } }
    ]},
    { text: "在学习上，你偏好：", options: [
        { text: "循序渐进，稳扎稳打", scores: { S: 2, N: 0 } },
        { text: "跳跃式学习，理解核心", scores: { S: 0, N: 2 } }
    ]},
    { text: "你对科技新产品的态度：", options: [
        { text: "关注实用功能和性能", scores: { S: 2, N: 0 } },
        { text: "关注创新理念和未来趋势", scores: { S: 0, N: 2 } }
    ]},
    { text: "在讲述事情时，你会：", options: [
        { text: "描述具体细节和过程", scores: { S: 2, N: 0 } },
        { text: "传达整体印象和感受", scores: { S: 0, N: 2 } }
    ]},
    { text: "你的决策风格：", options: [
        { text: "基于数据和事实", scores: { S: 2, N: 0 } },
        { text: "基于直觉和愿景", scores: { S: 0, N: 2 } }
    ]},
    { text: "你对隐喻的理解：", options: [
        { text: "从字面和实际意义理解", scores: { S: 2, N: 0 } },
        { text: "从象征和深层意义理解", scores: { S: 0, N: 2 } }
    ]},
    { text: "在工作汇报中，你更倾向：", options: [
        { text: "列举具体数据和成果", scores: { S: 2, N: 0 } },
        { text: "分享愿景和战略思考", scores: { S: 0, N: 2 } }
    ]},
    { text: "你的关注点更多在：", options: [
        { text: "当前现实和实际问题", scores: { S: 2, N: 0 } },
        { text: "未来趋势和潜在可能", scores: { S: 0, N: 2 } }
    ]},
    { text: "在理解事物时，你：", options: [
        { text: "从具体实例开始", scores: { S: 2, N: 0 } },
        { text: "从理论框架开始", scores: { S: 0, N: 2 } }
    ]},
    { text: "你对现实的看法：", options: [
        { text: "相信眼见为实", scores: { S: 2, N: 0 } },
        { text: "相信背后有深层含义", scores: { S: 0, N: 2 } }
    ]},
    { text: "在项目执行中，你更注重：", options: [
        { text: "每个步骤的落实", scores: { S: 2, N: 0 } },
        { text: "整体方向的把握", scores: { S: 0, N: 2 } }
    ]},

    // T/F 维度（思考/情感）
    { text: "当朋友遇到困难时，你会：", options: [
        { text: "提供实际解决方案和建议", scores: { T: 2, F: 0 } },
        { text: "给予情感支持和安慰", scores: { T: 0, F: 2 } }
    ]},
    { text: "做决定时，你更看重：", options: [
        { text: "公平原则和逻辑一致性", scores: { T: 2, F: 0 } },
        { text: "和谐关系和他人感受", scores: { T: 0, F: 2 } }
    ]},
    { text: "在争论中，你更倾向于：", options: [
        { text: "追求逻辑正确和真理", scores: { T: 2, F: 0 } },
        { text: "维护关系和谐", scores: { T: 0, F: 2 } }
    ]},
    { text: "面对不公正的事情，你会：", options: [
        { text: "指出错误，坚持原则", scores: { T: 2, F: 0 } },
        { text: "考虑他人感受，温和处理", scores: { T: 0, F: 2 } }
    ]},
    { text: "你更看重：", options: [
        { text: "客观分析和理性判断", scores: { T: 2, F: 0 } },
        { text: "人际和谐和情感共鸣", scores: { T: 0, F: 2 } }
    ]},
    { text: "在团队合作中，你更倾向：", options: [
        { text: "就事论事，追求效率", scores: { T: 2, F: 0 } },
        { text: "维护团队氛围", scores: { T: 0, F: 2 } }
    ]},
    { text: "当有人提出观点时，你会：", options: [
        { text: "分析逻辑，寻找漏洞", scores: { T: 2, F: 0 } },
        { text: "理解感受，产生共鸣", scores: { T: 0, F: 2 } }
    ]},
    { text: "你的说服方式是：", options: [
        { text: "用数据和逻辑证明", scores: { T: 2, F: 0 } },
        { text: "用情感和故事打动", scores: { T: 0, F: 2 } }
    ]},
    { text: "面对批评，你更在乎：", options: [
        { text: "批评的内容是否合理", scores: { T: 2, F: 0 } },
        { text: "批评者的感受和动机", scores: { T: 0, F: 2 } }
    ]},
    { text: "在决策时，你会：", options: [
        { text: "权衡利弊，理性选择", scores: { T: 2, F: 0 } },
        { text: "考虑对他人的影响", scores: { T: 0, F: 2 } }
    ]},
    { text: "你的价值观更倾向：", options: [
        { text: "真理和正义", scores: { T: 2, F: 0 } },
        { text: "仁慈和善良", scores: { T: 0, F: 2 } }
    ]},
    { text: "在讨论问题时，你：", options: [
        { text: "直接指出逻辑错误", scores: { T: 2, F: 0 } },
        { text: "委婉表达，照顾情绪", scores: { T: 0, F: 2 } }
    ]},
    { text: "面对两难选择，你会：", options: [
        { text: "选择更理性的选项", scores: { T: 2, F: 0 } },
        { text: "选择更符合情感的选项", scores: { T: 0, F: 2 } }
    ]},
    { text: "你的领导风格：", options: [
        { text: "设定规则，严格执行", scores: { T: 2, F: 0 } },
        { text: "关怀员工，灵活管理", scores: { T: 0, F: 2 } }
    ]},
    { text: "在评价他人时，你更看重：", options: [
        { text: "能力和成就", scores: { T: 2, F: 0 } },
        { text: "品德和态度", scores: { T: 0, F: 2 } }
    ]},
    { text: "面对冲突，你会：", options: [
        { text: "直接面对，解决问题", scores: { T: 2, F: 0 } },
        { text: "照顾感受，寻求和解", scores: { T: 0, F: 2 } }
    ]},
    { text: "你的沟通风格：", options: [
        { text: "简洁明了，直截了当", scores: { T: 2, F: 0 } },
        { text: "温和委婉，表达含蓄", scores: { T: 0, F: 2 } }
    ]},
    { text: "在工作中，你更注重：", options: [
        { text: "任务完成的效率和质量", scores: { T: 2, F: 0 } },
        { text: "团队成员的感受和发展", scores: { T: 0, F: 2 } }
    ]},
    { text: "做选择时，你依赖：", options: [
        { text: "逻辑推理和客观分析", scores: { T: 2, F: 0 } },
        { text: "内心感受和价值观", scores: { T: 0, F: 2 } }
    ]},
    { text: "你对规则的态度：", options: [
        { text: "严格遵守，不论情况", scores: { T: 2, F: 0 } },
        { text: "根据情况灵活处理", scores: { T: 0, F: 2 } }
    ]},
    { text: "在辩论中，你更擅长：", options: [
        { text: "找出对方的逻辑漏洞", scores: { T: 2, F: 0 } },
        { text: "理解对方的情感立场", scores: { T: 0, F: 2 } }
    ]},
    { text: "你的决策依据：", options: [
        { text: "利弊分析和成本收益", scores: { T: 2, F: 0 } },
        { text: "价值观和人际关系", scores: { T: 0, F: 2 } }
    ]},
    { text: "面对错误，你更在意：", options: [
        { text: "错误本身的客观事实", scores: { T: 2, F: 0 } },
        { text: "对他人的影响和伤害", scores: { T: 0, F: 2 } }
    ]},
    { text: "你的表达风格更倾向：", options: [
        { text: "理性分析，不带情绪", scores: { T: 2, F: 0 } },
        { text: "情感丰富，感染力强", scores: { T: 0, F: 2 } }
    ]},
    { text: "在团队中，你更看重：", options: [
        { text: "专业能力和效率", scores: { T: 2, F: 0 } },
        { text: "团队凝聚力和氛围", scores: { T: 0, F: 2 } }
    ]},
    { text: "面对复杂问题，你：", options: [
        { text: "分解问题，逐步解决", scores: { T: 2, F: 0 } },
        { text: "考虑各方利益，寻求平衡", scores: { T: 0, F: 2 } }
    ]},
    { text: "你的说服力来自：", options: [
        { text: "事实依据和逻辑论证", scores: { T: 2, F: 0 } },
        { text: "情感共鸣和价值认同", scores: { T: 0, F: 2 } }
    ]},
    { text: "在评价产品时，你关注：", options: [
        { text: "技术参数和性能指标", scores: { T: 2, F: 0 } },
        { text: "用户体验和情感价值", scores: { T: 0, F: 2 } }
    ]},

    // J/P 维度（判断/感知）
    { text: "在处理任务时，你喜欢：", options: [
        { text: "制定详细计划，按步骤执行", scores: { J: 2, P: 0 } },
        { text: "灵活应对，随机应变", scores: { J: 0, P: 2 } }
    ]},
    { text: "面对截止日期，你会：", options: [
        { text: "提前完成，避免最后时刻的压力", scores: { J: 2, P: 0 } },
        { text: "在压力下激发效率", scores: { J: 0, P: 2 } }
    ]},
    { text: "你的工作方式更倾向于：", options: [
        { text: "按时完成，不喜欢拖延", scores: { J: 2, P: 0 } },
        { text: "在最后时刻前保持灵活", scores: { J: 0, P: 2 } }
    ]},
    { text: "在日常安排上，你：", options: [
        { text: "喜欢制定并遵守时间表", scores: { J: 2, P: 0 } },
        { text: "喜欢保持灵活，随性而为", scores: { J: 0, P: 2 } }
    ]},
    { text: "面对突发情况，你会：", options: [
        { text: "希望按计划行事", scores: { J: 2, P: 0 } },
        { text: "喜欢随机应变", scores: { J: 0, P: 2 } }
    ]},
    { text: "你的生活环境：", options: [
        { text: "整洁有序，物品有固定位置", scores: { J: 2, P: 0 } },
        { text: "随意摆放，看似混乱但有逻辑", scores: { J: 0, P: 2 } }
    ]},
    { text: "在做计划时，你：", options: [
        { text: "详细列出每个步骤", scores: { J: 2, P: 0 } },
        { text: "设定大致方向，灵活调整", scores: { J: 0, P: 2 } }
    ]},
    { text: "面对未完成的工作，你：", options: [
        { text: "感到压力，希望尽快完成", scores: { J: 2, P: 0 } },
        { text: "可以等待，最后时刻完成", scores: { J: 0, P: 2 } }
    ]},
    { text: "你的旅行风格：", options: [
        { text: "制定详细行程，按计划执行", scores: { J: 2, P: 0 } },
        { text: "大致规划，随机应变", scores: { J: 0, P: 2 } }
    ]},
    { text: "在学习上，你偏好：", options: [
        { text: "按计划系统学习", scores: { J: 2, P: 0 } },
        { text: "跳跃式学习，随机深入", scores: { J: 0, P: 2 } }
    ]},
    { text: "面对选择，你倾向于：", options: [
        { text: "尽快做出决定", scores: { J: 2, P: 0 } },
        { text: "保持开放，收集更多信息", scores: { J: 0, P: 2 } }
    ]},
    { text: "你的时间管理：", options: [
        { text: "使用日历，严格安排", scores: { J: 2, P: 0 } },
        { text: "灵活安排，随性而为", scores: { J: 0, P: 2 } }
    ]},
    { text: "面对变化，你会：", options: [
        { text: "希望提前通知，做好准备", scores: { J: 2, P: 0 } },
        { text: "喜欢惊喜，享受变化", scores: { J: 0, P: 2 } }
    ]},
    { text: "在项目执行中，你更注重：", options: [
        { text: "按时间节点推进", scores: { J: 2, P: 0 } },
        { text: "保持灵活性，适时调整", scores: { J: 0, P: 2 } }
    ]},
    { text: "面对多种任务，你会：", options: [
        { text: "逐一完成，不喜欢并行", scores: { J: 2, P: 0 } },
        { text: "同时进行，多任务处理", scores: { J: 0, P: 2 } }
    ]},
    { text: "你的工作环境偏好：", options: [
        { text: "结构化，有明确要求", scores: { J: 2, P: 0 } },
        { text: "自由灵活，允许探索", scores: { J: 0, P: 2 } }
    ]},
    { text: "在做决定时，你：", options: [
        { text: "快速决断，不再犹豫", scores: { J: 2, P: 0 } },
        { text: "反复考虑，保持开放", scores: { J: 0, P: 2 } }
    ]},
    { text: "面对deadline，你：", options: [
        { text: "严格按时完成", scores: { J: 2, P: 0 } },
        { text: "可以适当推迟", scores: { J: 0, P: 2 } }
    ]},
    { text: "你的生活态度：", options: [
        { text: "有计划性，喜欢确定性", scores: { J: 2, P: 0 } },
        { text: "随性自由，喜欢惊喜", scores: { J: 0, P: 2 } }
    ]},
    { text: "在购物时，你：", options: [
        { text: "按清单购买，不随意更改", scores: { J: 2, P: 0 } },
        { text: "随意浏览，看到喜欢的就买", scores: { J: 0, P: 2 } }
    ]},
    { text: "面对未知的未来，你：", options: [
        { text: "希望尽快明确方向", scores: { J: 2, P: 0 } },
        { text: "享受探索的可能性", scores: { J: 0, P: 2 } }
    ]},
    { text: "在团队中，你倾向于：", options: [
        { text: "明确分工，各司其职", scores: { J: 2, P: 0 } },
        { text: "灵活协作，共同探索", scores: { J: 0, P: 2 } }
    ]},
    { text: "你的决策风格：", options: [
        { text: "果断决断，迅速行动", scores: { J: 2, P: 0 } },
        { text: "持续观察，灵活调整", scores: { J: 0, P: 2 } }
    ]},
    { text: "面对突发事件，你会：", options: [
        { text: "希望尽快恢复秩序", scores: { J: 2, P: 0 } },
        { text: "可以接受暂时的混乱", scores: { J: 0, P: 2 } }
    ]},
    { text: "你的做事风格：", options: [
        { text: "有始有终，按部就班", scores: { J: 2, P: 0 } },
        { text: "灵活机动，顺势而为", scores: { J: 0, P: 2 } }
    ]}
];

// MBTI 16 种人格类型
const personalityTypes = {
    INTJ: { name: '建筑师', desc: '独立有远见，善于战略规划，追求卓越与创新。', traits: ['战略思维', '独立', '追求完美'] },
    INTP: { name: '逻辑学家', desc: '善于分析，好奇心强，喜欢探索理论与抽象概念。', traits: ['逻辑分析', '创新', '客观'] },
    ENTJ: { name: '指挥官', desc: '领导力强，果断高效，善于组织和达成目标。', traits: ['领导力', '果断', '目标导向'] },
    ENTP: { name: '辩论家', desc: '思维敏捷，善于辩论，喜欢挑战和探索新可能。', traits: ['创新', '灵活', '善于辩论'] },
    INFJ: { name: '提倡者', desc: '理想主义，富有同情心，致力于帮助他人成长。', traits: ['理想主义', '共情', '有洞察力'] },
    INFP: { name: '调停者', desc: '理想主义且善良，忠于价值观，富有创造力。', traits: ['理想主义', '善良', '适应性强'] },
    ENFJ: { name: '主人公', desc: '富有魅力，善于激励他人，天生的领导者。', traits: ['魅力', '利他', '鼓舞人心'] },
    ENFP: { name: '竞选者', desc: '热情洋溢，创造力强，社交广泛，充满好奇心。', traits: ['热情', '创造力', '社交'] },
    ISTJ: { name: '物流师', desc: '负责任、诚实、务实，善于组织和执行计划。', traits: ['负责', '务实', '有纪律'] },
    ISFJ: { name: '守卫者', desc: '支持性强、可靠、耐心，温暖体贴地照顾他人。', traits: ['可靠', '耐心', '温暖'] },
    ESTJ: { name: '总经理', desc: '组织能力强，务实有逻辑，出色的管理者。', traits: ['组织力', '务实', '管理'] },
    ESFJ: { name: '执政官', desc: '善于合作，支持性强，可靠且有同情心。', traits: ['合作', '可靠', '共情'] },
    ISTP: { name: '鉴赏家', desc: '灵活理性，动手能力强，善于解决实际问题。', traits: ['灵活', '理性', '动手能力'] },
    ISFP: { name: '探险家', desc: '敏感友善，谦逊迷人，富有艺术气质。', traits: ['敏感', '友善', '艺术'] },
    ESTP: { name: '企业家', desc: '精力充沛，感知力强，善于冒险和即兴发挥。', traits: ['精力充沛', '冒险', '即兴'] },
    ESFP: { name: '娱乐家', desc: '热情友善，充满活力，善于带动气氛。', traits: ['热情', '活力', '社交'] }
};

// 游戏状态
let currentQuestion = 0;
let selectedQuestions = [];
let userAnswers = []; // 存储用户的答案
let scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
let selectedCount = 12;

// DOM 元素
const setupCard = document.getElementById('setupCard');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const questionCard = document.getElementById('questionCard');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const resultCard = document.getElementById('resultCard');
const resultType = document.getElementById('resultType');
const resultName = document.getElementById('resultName');
const resultDesc = document.getElementById('resultDesc');
const resultTraits = document.getElementById('resultTraits');
const answerList = document.getElementById('answerList');
const restartBtn = document.getElementById('restartBtn');
const startBtn = document.getElementById('startBtn');
const subtitle = document.getElementById('subtitle');
const GAME_ID = 'mbti-test';
const STORAGE_PREFIX = `miniGames.v1.${GAME_ID}`;
const STORAGE_KEYS = {
    best: `${STORAGE_PREFIX}.best`,
    stats: `${STORAGE_PREFIX}.stats`,
    progress: `${STORAGE_PREFIX}.progress`
};

// 题目数量选择
document.querySelectorAll('.count-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        selectedCount = parseInt(this.dataset.count);
    });
});

// 默认选中 12 题
document.querySelector('.count-btn[data-count="12"]').classList.add('selected');

// 开始测试
startBtn.addEventListener('click', () => {
    // 随机选择题目
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    selectedQuestions = shuffled.slice(0, selectedCount);

    // 重置状态
    currentQuestion = 0;
    userAnswers = [];
    scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    // 切换界面
    setupCard.style.display = 'none';
    progressBar.style.display = 'block';
    questionCard.style.display = 'flex';

    // 更新副标题
    subtitle.textContent = `回答 ${selectedCount} 道问题，探索你的性格类型`;

    showQuestion();
});

// 显示问题
function showQuestion() {
    if (currentQuestion >= selectedQuestions.length) {
        showResult();
        return;
    }

    const question = selectedQuestions[currentQuestion];
    questionText.textContent = `${currentQuestion + 1}. ${question.text}`;

    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option.text;
        btn.onclick = () => selectOption(option, index);
        optionsContainer.appendChild(btn);
    });

    // 移除所有按钮的焦点，避免移动端焦点残留
    document.activeElement?.blur();

    updateProgress();
}

// 选择选项
function selectOption(option, index) {
    if (typeof GameAudio !== 'undefined') GameAudio.play('click');

    // 记录答案
    userAnswers.push({
        question: selectedQuestions[currentQuestion],
        selectedOption: option,
        selectedIndex: index
    });

    // 累加分数
    for (let dimension in option.scores) {
        scores[dimension] += option.scores[dimension];
    }

    currentQuestion++;
    showQuestion();
}

// 更新进度条
function updateProgress() {
    const progress = (currentQuestion / selectedQuestions.length) * 100;
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
    progressBar.style.display = 'none';
    resultCard.style.display = 'block';
    restartBtn.style.display = 'inline-block';

    if (typeof GameAudio !== 'undefined') GameAudio.play('win');
    if (typeof GameCelebration !== 'undefined') GameCelebration.show();

    const type = calculateResult();
    const result = personalityTypes[type];

    resultType.textContent = type;
    resultName.textContent = result.name;
    resultDesc.textContent = result.desc;

    resultTraits.innerHTML = result.traits.map(trait =>
        `<span class="trait-tag">${trait}</span>`
    ).join('');

    // 保存结果到历史记录
    saveToHistory(type);
    localStorage.setItem(STORAGE_KEYS.best, type);
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({
        type,
        selectedCount,
        finishedAt: Date.now()
    }));

    // 显示历次结果
    displayHistory();

    // 显示用户选择的答案
    displayAnswers();
}

// 保存测试结果到 localStorage
function saveToHistory(type) {
    try {
        let history = JSON.parse(localStorage.getItem('mbtiHistory') || '[]');
        history.push({
            type: type,
            date: new Date().toLocaleDateString('zh-CN')
        });
        // 最多保留 20 条记录
        if (history.length > 20) history = history.slice(-20);
        localStorage.setItem('mbtiHistory', JSON.stringify(history));
        localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify({
            historyCount: history.length,
            lastType: type,
            updatedAt: Date.now()
        }));
    } catch (e) {
        // 忽略存储错误
    }
}

function getDimensionBalance(type) {
    return {
        E: type.includes('E') ? 1 : 0,
        I: type.includes('I') ? 1 : 0,
        S: type.includes('S') ? 1 : 0,
        N: type.includes('N') ? 1 : 0,
        T: type.includes('T') ? 1 : 0,
        F: type.includes('F') ? 1 : 0,
        J: type.includes('J') ? 1 : 0,
        P: type.includes('P') ? 1 : 0
    };
}

function drawRadar(container, currentType, previousType) {
    const oldCanvas = document.getElementById('mbtiRadar');
    if (oldCanvas) oldCanvas.remove();
    if (!currentType) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'mbtiRadar';
    canvas.width = 220;
    canvas.height = 220;
    canvas.style.display = 'block';
    canvas.style.margin = '10px auto';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const center = 110;
    const radius = 82;
    const axes = ['E/I', 'S/N', 'T/F', 'J/P'];
    const current = getDimensionBalance(currentType);
    const previous = previousType ? getDimensionBalance(previousType) : null;
    const values = [
        current.E ? 1 : 0.55,
        current.S ? 1 : 0.55,
        current.T ? 1 : 0.55,
        current.J ? 1 : 0.55
    ];

    ctx.strokeStyle = '#d0d7ff';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
        const r = (radius / 4) * i;
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
            const a = -Math.PI / 2 + (Math.PI * 2 * j / 4);
            const x = center + Math.cos(a) * r;
            const y = center + Math.sin(a) * r;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    axes.forEach((axis, i) => {
        const a = -Math.PI / 2 + (Math.PI * 2 * i / 4);
        const x = center + Math.cos(a) * (radius + 20);
        const y = center + Math.sin(a) * (radius + 20);
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(axis, x, y);
    });

    if (previous) {
        const prevVals = [
            previous.E ? 1 : 0.55,
            previous.S ? 1 : 0.55,
            previous.T ? 1 : 0.55,
            previous.J ? 1 : 0.55
        ];
        ctx.fillStyle = 'rgba(180,180,180,0.25)';
        ctx.strokeStyle = 'rgba(120,120,120,0.6)';
        ctx.beginPath();
        prevVals.forEach((v, i) => {
            const a = -Math.PI / 2 + (Math.PI * 2 * i / 4);
            const x = center + Math.cos(a) * radius * v;
            const y = center + Math.sin(a) * radius * v;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(102,126,234,0.25)';
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((v, i) => {
        const a = -Math.PI / 2 + (Math.PI * 2 * i / 4);
        const x = center + Math.cos(a) * radius * v;
        const y = center + Math.sin(a) * radius * v;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// 显示历次结果
function displayHistory() {
    // 移除旧的历史区域（如果有）
    const oldSection = document.getElementById('historySection');
    if (oldSection) oldSection.remove();

    try {
        const history = JSON.parse(localStorage.getItem('mbtiHistory') || '[]');
        if (history.length <= 1) return; // 只有当前这一条，不显示

        const section = document.createElement('div');
        section.id = 'historySection';
        section.className = 'answer-section';
        section.innerHTML = `
            <h4 class="answer-section-title">历次结果</h4>
            <div class="answer-list" style="max-height:160px;">
                ${history.slice().reverse().map((item, i) =>
                    `<div class="answer-item" style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:600;color:#667eea;">${item.type}</span>
                        <span style="color:#999;font-size:12px;">${item.date}</span>
                    </div>`
                ).join('')}
            </div>
        `;

        // 插入到结果区域的答案区之前
        const answerSection = resultCard.querySelector('.answer-section');
        if (answerSection) {
            resultCard.insertBefore(section, answerSection);
        } else {
            resultCard.appendChild(section);
        }

        const current = history[history.length - 1]?.type;
        const previous = history.length > 1 ? history[history.length - 2]?.type : '';
        drawRadar(section, current, previous);
    } catch (e) {
        // 忽略解析错误
    }
}

// 显示答案列表
function displayAnswers() {
    answerList.innerHTML = '';

    userAnswers.forEach((answer, index) => {
        const item = document.createElement('div');
        item.className = 'answer-item';
        item.innerHTML = `
            <div class="answer-question">${index + 1}. ${answer.question.text}</div>
            <div class="answer-choice">✓ ${answer.selectedOption.text}</div>
        `;
        answerList.appendChild(item);
    });
}

// 重新测试
restartBtn.addEventListener('click', () => {
    resultCard.style.display = 'none';
    restartBtn.style.display = 'none';
    setupCard.style.display = 'block';
    questionCard.style.display = 'none';
    progressBar.style.display = 'none';

    // 清空答案列表
    answerList.innerHTML = '';

    // 重置副标题
    subtitle.textContent = '选择题目数量，探索你的性格类型';
});

window.render_game_to_text = () => JSON.stringify({
    mode: resultCard.style.display === 'block' ? 'result' : (questionCard.style.display === 'flex' ? 'question' : 'setup'),
    selectedCount,
    currentQuestion,
    totalQuestions: selectedQuestions.length,
    scores
});

window.advanceTime = () => {
    // MBTI 是离散交互流程，无连续时间推进
};

window.get_game_meta = () => JSON.stringify({
    gameId: GAME_ID,
    version: 'v1',
    mode: 'quiz'
});
