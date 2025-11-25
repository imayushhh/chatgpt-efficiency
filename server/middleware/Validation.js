export default function validateEvaluationRequest(req, res, next) {
  const { domain, limit  } = req.query;

  if (!domain) {
    return res.status(400).json({ error: "Provide domain in the query string." });
  }

  if (domain) {
    const allowed = ["History", "Social_Science", "Computer_Security"];
    if (!allowed.includes(domain)) {
      return res.status(400).json({ error: `'domain' must be one of: ${allowed.join(", ")}` });
    }
  }

  if (limit !== undefined) {
    const n = Number(limit);
    if (isNaN(n) || !Number.isInteger(n) || n <= 0) {
      return res.status(400).json({ error: "'limit' must be a positive integer." });
    }
    if (n > 100) { // safety cap
      return res.status(400).json({ error: "'limit' must be <= 100." });
    }
  }

  next();
}
