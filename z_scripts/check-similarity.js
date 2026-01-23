/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });

const { InferenceClient } = require("@huggingface/inference");
const neo4j = require("neo4j-driver");

const question =
  "Quelles sont les procédures d'amende et de confiscation en matière de concurrence ?";

(async () => {
  const client = new InferenceClient({ apiKey: process.env.HUGGINGFACE_API_KEY });
  const driver = neo4j.driver(
    "neo4j://localhost:7687",
    neo4j.auth.basic("neo4j", "password"),
  );

  console.log(`📝 Question: ${question}\n`);

  const embedding = await client.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L12-v2",
    inputs: question,
  });

  const session = driver.session();
  const result = await session.run(
    `CALL db.index.vector.queryNodes('article_embeddings', 20, $embedding)
    YIELD node, score
    RETURN node.numero_article as num, node.titre_loi as law, score
    ORDER BY score DESC`,
    { embedding },
  );

  console.log(`📊 Scores de similarité:\n`);
  result.records.forEach((r, idx) => {
    const { num, law, score } = r.toObject();
    const thresholds = [
      score >= 0.72 ? "✅ 0.72" : "❌ 0.72",
      score >= 0.70 ? "✅ 0.70" : "❌ 0.70",
      score >= 0.65 ? "✅ 0.65" : "❌ 0.65",
      score >= 0.50 ? "✅ 0.50" : "❌ 0.50",
    ];
    console.log(
      `${(idx + 1)
        .toString()
        .padEnd(3)} | ${num.padEnd(15)} | ${(law || "").slice(0, 40).padEnd(40)} | ${score.toFixed(4)} | ${thresholds.join(" | ")}`,
    );
  });

  session.close();
  driver.close();
})();
