// Placeholder seed script
// The question bank will be handled in src/lib/mbti/questions.ts

async function main() {
  console.log("Seed complete");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
