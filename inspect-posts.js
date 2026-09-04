const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check all posts with their exact field values
  const posts = await prisma.post.findMany({
    select: { title: true, type: true, status: true, slug: true },
  });
  console.log('All posts:');
  console.log(JSON.stringify(posts, null, 2));

  // Try both type filters
  const withTypeFilter = await prisma.post.findMany({
    where: { type: { not: 'note' } },
    select: { title: true, type: true },
  });
  console.log('\ntype != note:');
  console.log(JSON.stringify(withTypeFilter, null, 2));

  const withTypeNull = await prisma.post.findMany({
    where: { type: null },
    select: { title: true, type: true },
  });
  console.log('\ntype is null:');
  console.log(JSON.stringify(withTypeNull, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => { await prisma.$disconnect(); });
