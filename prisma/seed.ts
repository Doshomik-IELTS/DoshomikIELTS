import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demo = await prisma.profile.upsert({
    where: { authUserId: "dev:learner" },
    update: {
      email: "demo@ieltspp.local",
      name: "Demo Learner",
      targetBand: 6.5,
      examDate: new Date("2026-12-31"),
      nativeLanguage: "Bangla",
      studyGoal: "Reach IELTS 6.5+ with strong foundations",
      streak: 5,
      longestStreak: 12,
      lastStudyDate: new Date(),
    },
    create: {
      authUserId: "dev:learner",
      email: "demo@ieltspp.local",
      name: "Demo Learner",
      targetBand: 6.5,
      examDate: new Date("2026-12-31"),
      nativeLanguage: "Bangla",
      studyGoal: "Reach IELTS 6.5+ with strong foundations",
      streak: 5,
      longestStreak: 12,
      lastStudyDate: new Date(),
      roles: { create: { role: "learner" } },
    },
    include: { roles: true },
  });

  await prisma.role.createMany({
    data: [{ profileId: demo.id, role: "admin" }],
    skipDuplicates: true,
  });

  const existingSeedCredits = await prisma.creditLedger.findFirst({
    where: {
      profileId: demo.id,
      type: "promo",
      refId: "seed:demo-credits",
    },
  });

  if (!existingSeedCredits) {
    await prisma.creditLedger.create({
      data: {
        profileId: demo.id,
        amount: 5,
        type: "promo",
        description: "Seed credits for demo learner",
        refId: "seed:demo-credits",
      },
    });
  }

  const resources = [
    {
      title: "Basic Sentence Structure",
      slug: "basic-sentence-structure",
      category: "basic_english" as const,
      difficulty: "basic" as const,
      body: "A simple English sentence usually has a subject, a verb, and often an object. Example: I study English every day.\n\nThe basic word order in English is Subject + Verb + Object (SVO). This is the most common sentence pattern.",
      examplesJson: [
        { label: "SVO", text: "She reads books every morning." },
        { label: "SVO", text: "They played football in the park." }
      ],
      tags: ["basic-english", "sentence-structure"]
    },
    {
      title: "Common IELTS Vocabulary: Education",
      slug: "common-ielts-vocabulary-education",
      category: "words" as const,
      difficulty: "intermediate" as const,
      body: "Key vocabulary for talking about education:\n\n• Curriculum - the courses taught at a school\n• Academic - relating to education and scholarship\n• Enroll - to register for a course\n• Degree - a qualification from a university\n• Scholarship - financial support for students",
      examplesJson: [
        { label: "Example", text: "She received a scholarship to study at Oxford." },
        { label: "Example", text: "The university curriculum includes many optional subjects." }
      ],
      tags: ["vocabulary", "education", "ielts"]
    },
    {
      title: "Understanding Article Usage",
      slug: "understanding-article-usage",
      category: "grammar" as const,
      difficulty: "intermediate" as const,
      body: "Articles (a, an, the) are small words that come before nouns.\n\n• A/AN - indefinite article for singular countable nouns\n• THE - definite article for specific or previously mentioned items\n• No article - for uncountable nouns, plural nouns, and proper nouns",
      examplesJson: [
        { label: "Indefinite", text: "I need a computer for my studies." },
        { label: "Definite", text: "The book on the desk is mine." }
      ],
      tags: ["grammar", "articles", "fundamentals"]
    },
    {
      title: "Reading: Skimming and Scanning",
      slug: "reading-skimming-scanning",
      category: "reading_strategy" as const,
      difficulty: "intermediate" as const,
      body: "Two essential reading techniques for IELTS:\n\n**Skimming**: Quick reading to get the main idea. Read the introduction, first sentence of each paragraph, and conclusion.\n\n**Scanning**: Looking for specific information. Don't read everything - look for keywords, numbers, or names.",
      examplesJson: [
        { label: "Skimming", text: "Read the title and first paragraph to understand the main topic." },
        { label: "Scanning", text: "Look for dates, names, or numbers when searching for specific facts." }
      ],
      tags: ["reading", "strategy", "technique"]
    },
    {
      title: "Writing: Task 1 Overview",
      slug: "writing-task-1-overview",
      category: "writing_strategy" as const,
      difficulty: "intermediate" as const,
      body: "IELTS Writing Task 1 requires you to describe visual information in at least 150 words.\n\nKey tips:\n• Spend about 20 minutes on this task\n• Write 4-5 paragraphs\n• Include an overview statement\n• Report key features without giving your opinion",
      examplesJson: [
        { label: "Structure", text: "Introduction + Overview + Body Paragraph 1 + Body Paragraph 2" },
        { label: "Overview", text: "The chart shows that electricity usage increased significantly over the period." }
      ],
      tags: ["writing", "task1", "strategy"]
    },
  ];

  for (const r of resources) {
    await prisma.resource.upsert({
      where: { slug: r.slug },
      update: {},
      create: { ...r, status: "published", createdById: demo.id },
    });
  }

  const existingDeck = await prisma.flashCardDeck.findUnique({ where: { id: "demo-vocabulary-deck" } });
  
  if (!existingDeck) {
    await prisma.flashCardDeck.create({
      data: {
        id: "demo-vocabulary-deck",
        title: "Essential IELTS Words",
        description: "Most common IELTS vocabulary for band 6+",
        category: "vocabulary",
        difficulty: "intermediate",
        status: "published",
        publishedAt: new Date(),
        tags: ["ielts", "vocabulary", "essential"],
        cards: {
          create: [
            { front: "What does 'accumulate' mean?", back: "To gather or collect over time", examples: ["She accumulated wealth through smart investments."], hints: ["Think: collect"], difficulty: "intermediate" },
            { front: "What does 'significant' mean?", back: "Important or noteworthy", examples: ["There was a significant increase in applications."], hints: ["Think: important"], difficulty: "basic" },
            { front: "What does 'adequate' mean?", back: "Sufficient or enough", examples: ["We need adequate time to prepare."], hints: ["Think: enough"], difficulty: "intermediate" },
            { front: "What does 'prioritize' mean?", back: "To arrange in order of importance", examples: ["Students must prioritize their study time."], hints: ["Think: rank by importance"], difficulty: "intermediate" },
            { front: "What does 'mitigate' mean?", back: "To make less severe or serious", examples: ["Measures were taken to mitigate the impact."], hints: ["Think: reduce"], difficulty: "advanced" },
          ],
        },
      },
    });
  }

  const flashcardDeck = await prisma.flashCardDeck.findUnique({ 
    where: { id: "demo-vocabulary-deck" },
    include: { cards: true }
  });

  const test = await prisma.test.upsert({
    where: { id: "demo-short-mock-1" },
    update: {},
    create: {
      id: "demo-short-mock-1",
      title: "Practice Test 1 (Short)",
      type: "short_mock",
      status: "published",
      publishedAt: new Date(),
      estimatedDurationMinutes: 45,
      sections: {
        create: [
          {
            module: "listening",
            title: "Listening Section 1",
            instructions: "You will listen to a conversation and answer questions.",
            durationMinutes: 10,
            orderIndex: 0,
            questions: {
              create: [
                { questionType: "multiple_choice", prompt: "What is the main topic of the conversation?", optionsJson: ["Travel", "Education", "Health", "Work"], orderIndex: 0, difficulty: "basic" },
                { questionType: "short_answer", prompt: "When is the meeting scheduled?", orderIndex: 1, difficulty: "basic" },
              ],
            },
          },
          {
            module: "reading",
            title: "Reading Section 1",
            instructions: "Read the passage and answer the questions.",
            durationMinutes: 15,
            orderIndex: 1,
            contentJson: { title: "The Benefits of Reading", body: "Reading is one of the most beneficial activities..." },
            questions: {
              create: [
                { questionType: "true_false_not_given", prompt: "Reading improves memory.", orderIndex: 0, difficulty: "basic" },
                { questionType: "multiple_choice", prompt: "According to the passage, how much should one read daily?", optionsJson: ["30 minutes", "1 hour", "2 hours", "As much as possible"], orderIndex: 1, difficulty: "intermediate" },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.achievement.createMany({
    data: [
      { slug: "first-login", name: "First Step", description: "Complete your first login", icon: "👋" },
      { slug: "first-resource", name: "Explorer", description: "Read your first resource", icon: "📚" },
      { slug: "first-practice", name: "Practitioner", description: "Complete your first practice", icon: "✍️" },
      { slug: "first-mock", name: "Test Taker", description: "Start your first mock test", icon: "🎯" },
      { slug: "streak-7", name: "Week Warrior", description: "Study for 7 days in a row", icon: "🔥" },
      { slug: "streak-30", name: "Monthly Master", description: "Study for 30 days in a row", icon: "⭐" },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Demo data seeded successfully!");
  console.log(`   - Profile: ${demo.email}`);
  console.log(`   - Resources: ${resources.length}`);
  if (flashcardDeck) {
    console.log(`   - Flashcards: ${flashcardDeck.cards.length} cards`);
  }
  console.log(`   - Test: ${test.title}`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
