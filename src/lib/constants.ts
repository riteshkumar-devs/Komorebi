export const ACHIEVEMENT_CATEGORIES = [
  { id: 'milestones', title: 'Milestones', icon: '🏆' },
  { id: 'streaks', title: 'Streaks', icon: '🔥' },
  { id: 'vocabulary', title: 'Vocabulary', icon: '📚' },
  { id: 'ranks', title: 'Ranks', icon: '⚔️' },
  { id: 'social', title: 'Social', icon: '💬' },
];

export const ACHIEVEMENTS = [
  { id: 'first_word', category: 'milestones', title: 'First Steps', description: 'Add your first vocabulary word.', icon: '🌱', reward: 50 },
  { id: 'streak_3', category: 'streaks', title: 'Getting Serious', description: 'Maintain a 3-day streak.', icon: '🔥', reward: 100 },
  { id: 'streak_7', category: 'streaks', title: 'Dedicated Learner', description: 'Maintain a 7-day streak.', icon: '✨', reward: 250 },
  { id: 'streak_30', category: 'streaks', title: 'Language Master', description: 'Maintain a 30-day streak.', icon: '👑', reward: 1000 },
  { id: 'vocab_50', category: 'vocabulary', title: 'Word Collector', description: 'Learn 50 words.', icon: '📚', reward: 500 },
  { id: 'vocab_100', category: 'vocabulary', title: 'Linguist', description: 'Learn 100 words.', icon: '🖋️', reward: 1000 },
  { id: 'vocab_500', category: 'vocabulary', title: 'Scholar', description: 'Learn 500 words.', icon: '🎓', reward: 2500 },
  { id: 'rank_d', category: 'ranks', title: 'D-Rank Hunter', description: 'Reach D-Rank.', icon: '⚔️', reward: 300 },
  { id: 'rank_c', category: 'ranks', title: 'C-Rank Hunter', description: 'Reach C-Rank.', icon: '🛡️', reward: 600 },
  { id: 'rank_b', category: 'ranks', title: 'B-Rank Hunter', description: 'Reach B-Rank.', icon: '⚡', reward: 1200 },
  { id: 'rank_a', category: 'ranks', title: 'A-Rank Hunter', description: 'Reach A-Rank.', icon: '🔥', reward: 2500 },
  { id: 'rank_s', category: 'ranks', title: 'S-Rank Hunter', description: 'Reach S-Rank.', icon: '🌑', reward: 5000 },
  { id: 'quiz_perfect', category: 'milestones', title: 'Perfect Score', description: 'Get 100% on a quiz.', icon: '💯', reward: 200 },
  { id: 'kana_master', category: 'milestones', title: 'Kana Master', description: 'Complete all Hiragana and Katakana practice.', icon: '🎌', reward: 500 },
  { id: 'chat_10', category: 'social', title: 'Talkative', description: 'Have 10 conversations with Sensei.', icon: '💬', reward: 150 },
  ...Array.from({ length: 35 }).map((_, i) => ({
    id: `milestone_${i + 1}`,
    category: 'milestones',
    title: `Milestone ${i + 1}`,
    description: `Complete milestone ${i + 1} of your journey.`,
    icon: '🏆',
    reward: 50
  }))
];

export const AI_MODELS: Record<string, { id: string; name: string }[]> = {
  gemini: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Recommended)' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite (Fast)' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Economical)' },
    { id: 'o3-mini', name: 'o3-mini' },
  ],
  openrouter: [
    { id: 'openrouter/free', name: 'Free Models Router (Auto-selects active free model)' },
    { id: 'openrouter/auto', name: 'OpenRouter Auto Router (Best model)' },
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)' },
    { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B (Free)' },
    { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B (Free)' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)' },
  ],
  xai: [
    { id: 'grok-2-1212', name: 'Grok 2' },
    { id: 'grok-beta', name: 'Grok Beta' },
  ]
};

export const SOLO_LEVELING_RANKS = [
  'E5', 'E4', 'E3', 'E2', 'E1',
  'D5', 'D4', 'D3', 'D2', 'D1',
  'C5', 'C4', 'C3', 'C2', 'C1',
  'B5', 'B4', 'B3', 'B2', 'B1',
  'A5', 'A4', 'A3', 'A2', 'A1',
  'S5', 'S4', 'S3', 'S2', 'S1',
  'SS5', 'SS4', 'SS3', 'SS2', 'SS1',
  'SSS1'
];

export const ANIME_AVATARS = [
  { id: 'tanjiro', name: 'Tanjiro', series: 'Demon Slayer', icon: '🎴', price: 1000, description: 'The kind-hearted slayer with a water-breathing style.' },
  { id: 'nezuko', name: 'Nezuko', series: 'Demon Slayer', icon: '🎋', price: 1200, description: 'The demon girl who protects humans.' },
  { id: 'zenitsu', name: 'Zenitsu', series: 'Demon Slayer', icon: '⚡', price: 1000, description: 'Master of the Thunder Clap and Flash.' },
  { id: 'inosuke', name: 'Inosuke', series: 'Demon Slayer', icon: '🐗', price: 1000, description: 'The wild beast of the mountains.' },
  { id: 'rengoku', name: 'Rengoku', series: 'Demon Slayer', icon: '🔥', price: 2000, description: 'Set your heart ablaze!' },
  { id: 'shinobu', name: 'Shinobu', series: 'Demon Slayer', icon: '🦋', price: 1800, description: 'The Insect Hashira with a deadly sting.' },
  { id: 'giyu', name: 'Giyu', series: 'Demon Slayer', icon: '🌊', price: 1800, description: 'The stoic Water Hashira.' },
  { id: 'jinwoo', name: 'Sung Jin-Woo', series: 'Solo Leveling', icon: '🌑', price: 5000, description: 'The Shadow Monarch who leveled up alone.' },
  { id: 'igris', name: 'Igris', series: 'Solo Leveling', icon: '🛡️', price: 3000, description: 'The loyal Blood-Red Commander.' },
  { id: 'beru', name: 'Beru', series: 'Solo Leveling', icon: '🐜', price: 4000, description: 'The King of Ants and loyal shadow.' },
  { id: 'cha_hae_in', name: 'Cha Hae-In', series: 'Solo Leveling', icon: '⚔️', price: 2500, description: 'The S-Rank Hunter with a keen sense.' },
  { id: 'gojo', name: 'Satoru Gojo', series: 'Jujutsu Kaisen', icon: '♾️', price: 5000, description: 'The strongest jujutsu sorcerer.' },
  { id: 'itadori', name: 'Yuji Itadori', series: 'Jujutsu Kaisen', icon: '👊', price: 1500, description: 'The vessel of Sukuna.' },
  { id: 'sukuna', name: 'Sukuna', series: 'Jujutsu Kaisen', icon: '👅', price: 4000, description: 'The King of Curses.' },
  { id: 'megumi', name: 'Megumi Fushiguro', series: 'Jujutsu Kaisen', icon: '🐺', price: 2000, description: 'The Ten Shadows Technique user.' },
  { id: 'nobara', name: 'Nobara Kugisaki', series: 'Jujutsu Kaisen', icon: '🔨', price: 1800, description: 'The girl from the countryside with a hammer.' },
  { id: 'luffy', name: 'Monkey D. Luffy', series: 'One Piece', icon: '👒', price: 4500, description: 'The man who will become the Pirate King.' },
  { id: 'zoro', name: 'Roronoa Zoro', series: 'One Piece', icon: '⚔️', price: 3500, description: 'The Three-Sword Style master.' },
  { id: 'sanji', name: 'Vinsmoke Sanji', series: 'One Piece', icon: '🍳', price: 3000, description: 'The Black Leg cook of the Straw Hats.' },
  { id: 'naruto', name: 'Naruto Uzumaki', series: 'Naruto', icon: '🍥', price: 4500, description: 'The Seventh Hokage and hero of the Leaf.' },
  { id: 'sasuke', name: 'Sasuke Uchiha', series: 'Naruto', icon: '👁️', price: 4000, description: 'The last Uchiha with the Rinnegan.' },
  { id: 'kakashi', name: 'Kakashi Hatake', series: 'Naruto', icon: '📖', price: 3000, description: 'The Copy Ninja of the Leaf.' },
  { id: 'deku', name: 'Izuku Midoriya', series: 'My Hero Academia', icon: '🥦', price: 2500, description: 'The successor of One For All.' },
  { id: 'bakugo', name: 'Katsuki Bakugo', series: 'My Hero Academia', icon: '💥', price: 2500, description: 'The explosive hero with an iron will.' },
  { id: 'todoroki', name: 'Shoto Todoroki', series: 'My Hero Academia', icon: '❄️', price: 2800, description: 'Master of both fire and ice.' },
  { id: 'eren', name: 'Eren Yeager', series: 'Attack on Titan', icon: '🕊️', price: 4000, description: 'The boy who sought freedom.' },
  { id: 'levi', name: 'Levi Ackerman', series: 'Attack on Titan', icon: '🧹', price: 4500, description: 'Humanity\'s strongest soldier.' },
  { id: 'mikasa', name: 'Mikasa Ackerman', series: 'Attack on Titan', icon: '🧣', price: 3500, description: 'The protector of the world.' },
];

export const hiragana = [
  { kana: 'あ', romaji: 'a' }, { kana: 'い', romaji: 'i' }, { kana: 'う', romaji: 'u' }, { kana: 'え', romaji: 'e' }, { kana: 'お', romaji: 'o' },
  { kana: 'か', romaji: 'ka' }, { kana: 'き', romaji: 'ki' }, { kana: 'く', romaji: 'ku' }, { kana: 'け', romaji: 'ke' }, { kana: 'こ', romaji: 'ko' },
  { kana: 'さ', romaji: 'sa' }, { kana: 'し', romaji: 'shi' }, { kana: 'す', romaji: 'su' }, { kana: 'せ', romaji: 'se' }, { kana: 'そ', romaji: 'so' },
  { kana: 'た', romaji: 'ta' }, { kana: 'ち', romaji: 'chi' }, { kana: 'つ', romaji: 'tsu' }, { kana: 'て', romaji: 'te' }, { kana: 'と', romaji: 'to' },
  { kana: 'な', romaji: 'na' }, { kana: 'に', romaji: 'ni' }, { kana: 'ぬ', romaji: 'nu' }, { kana: 'ね', romaji: 'ne' }, { kana: 'の', romaji: 'no' },
  { kana: 'は', romaji: 'ha' }, { kana: 'ひ', romaji: 'hi' }, { kana: 'ふ', romaji: 'fu' }, { kana: 'へ', romaji: 'he' }, { kana: 'ほ', romaji: 'ho' },
  { kana: 'ま', romaji: 'ma' }, { kana: 'み', romaji: 'mi' }, { kana: 'む', romaji: 'mu' }, { kana: 'め', romaji: 'me' }, { kana: 'も', romaji: 'mo' },
  { kana: 'や', romaji: 'ya' }, { kana: 'ゆ', romaji: 'yu' }, { kana: 'よ', romaji: 'yo' },
  { kana: 'ら', romaji: 'ra' }, { kana: 'り', romaji: 'ri' }, { kana: 'る', romaji: 'ru' }, { kana: 'れ', romaji: 're' }, { kana: 'ろ', romaji: 'ro' },
  { kana: 'わ', romaji: 'wa' }, { kana: 'を', romaji: 'wo' }, { kana: 'ん', romaji: 'n' }
];

export const katakana = [
  { kana: 'ア', romaji: 'a' }, { kana: 'イ', romaji: 'i' }, { kana: 'ウ', romaji: 'u' }, { kana: 'エ', romaji: 'e' }, { kana: 'オ', romaji: 'o' },
  { kana: 'カ', romaji: 'ka' }, { kana: 'キ', romaji: 'ki' }, { kana: 'ク', romaji: 'ku' }, { kana: 'ケ', romaji: 'ke' }, { kana: 'コ', romaji: 'ko' },
  { kana: 'サ', romaji: 'sa' }, { kana: 'シ', romaji: 'shi' }, { kana: 'ス', romaji: 'su' }, { kana: 'セ', romaji: 'se' }, { kana: 'ソ', romaji: 'so' },
  { kana: 'タ', romaji: 'ta' }, { kana: 'チ', romaji: 'chi' }, { kana: 'ツ', romaji: 'tsu' }, { kana: 'テ', romaji: 'te' }, { kana: 'ト', romaji: 'to' },
  { kana: 'ナ', romaji: 'na' }, { kana: 'ニ', romaji: 'ni' }, { kana: 'ヌ', romaji: 'nu' }, { kana: 'ネ', romaji: 'ne' }, { kana: 'ノ', romaji: 'no' },
  { kana: 'ハ', romaji: 'ha' }, { kana: 'ヒ', romaji: 'hi' }, { kana: 'フ', romaji: 'fu' }, { kana: 'ヘ', romaji: 'he' }, { kana: 'ホ', romaji: 'ho' },
  { kana: 'マ', romaji: 'ma' }, { kana: 'ミ', romaji: 'mi' }, { kana: 'ム', romaji: 'mu' }, { kana: 'メ', romaji: 'me' }, { kana: 'モ', romaji: 'mo' },
  { kana: 'ヤ', romaji: 'ya' }, { kana: 'ユ', romaji: 'yu' }, { kana: 'ヨ', romaji: 'yo' },
  { kana: 'ラ', romaji: 'ra' }, { kana: 'リ', romaji: 'ri' }, { kana: 'ル', romaji: 'ru' }, { kana: 'レ', romaji: 're' }, { kana: 'ロ', romaji: 'ro' },
  { kana: 'ワ', romaji: 'wa' }, { kana: 'ヲ', romaji: 'wo' }, { kana: 'ン', romaji: 'n' }
];

export const PRACTICE_SENTENCES = [
  { japanese: "こんにちは、元気ですか？", romaji: "Konnichiwa, genki desu ka?", meaning: "Hello, how are you?" },
  { japanese: "私は学生です。", romaji: "Watashi wa gakusei desu.", meaning: "I am a student." },
  { japanese: "日本料理が大好きです。", romaji: "Nihon ryouri ga daisuki desu.", meaning: "I love Japanese food." },
  { japanese: "日本語を勉強しています。", romaji: "Nihongo o benkyou shite imasu.", meaning: "I am studying Japanese." },
  { japanese: "今日はいい天気ですね。", romaji: "Kyou wa ii tenki desu ne.", meaning: "The weather is nice today, isn't it?" },
  { japanese: "すみません、お水をください。", romaji: "Sumimasen, omizu o kudasai.", meaning: "Excuse me, please give me some water." },
  { japanese: "これはいくらですか？", romaji: "Kore wa ikura desu ka?", meaning: "How much is this?" },
  { japanese: "駅はどこにありますか？", romaji: "Eki wa doko ni arimasu ka?", meaning: "Where is the station?" },
  { japanese: "また明日会いましょう。", romaji: "Mata ashita aimashou.", meaning: "Let's meet again tomorrow." },
  { japanese: "始めまして、どうぞよろしく。", romaji: "Hajimemashite, douzo yoroshiku.", meaning: "Nice to meet you." },
  { japanese: "ありがとうございます。", romaji: "Arigatou gozaimasu.", meaning: "Thank you very much." },
  { japanese: "おいしいですね！", romaji: "Oishii desu ne!", meaning: "It's delicious!" },
  { japanese: "どこから来ましたか？", romaji: "Doko kara kimashita ka?", meaning: "Where did you come from?" },
  { japanese: "ちょっと待ってください。", romaji: "Chotto matte kudasai.", meaning: "Wait a moment please." },
  { japanese: "おやすみなさい。", romaji: "Oyasumi nasai.", meaning: "Good night." },
  { japanese: "さようなら。", romaji: "Sayounara.", meaning: "Goodbye." },
  { japanese: "お腹が空きました。", romaji: "Onaka ga sukimashita.", meaning: "I am hungry." },
  { japanese: "コーヒーが好きです。", romaji: "Koohii ga suki desu.", meaning: "I like coffee." },
  { japanese: "一緒に映画を見ませんか？", romaji: "Issho ni eiga o mimasen ka?", meaning: "Won't you watch a movie together?" },
  { japanese: "頑張ってください！", romaji: "Ganbatte kudasai!", meaning: "Please do your best!" }
];
