// A single, consolidated worker to handle all API requests.

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    const url = new URL(request.url);

    try {
      // Route requests to the appropriate handler
      if (url.pathname === "/save-score") {
        return await handleSaveScore(request, env);
      }
      if (url.pathname === "/leaderboard") {
        return await handleGetLeaderboard(request, env);
      }
      if (url.pathname === "/reward") {
        return await handleReward(request, env);
      }
      if (url.pathname === "/balance") {
        return await handleGetBalance(request, env);
      }
      if (url.pathname === "/purchase-frame") {
        return await handlePurchaseFrame(request, env);
      }

      // Handle root and other paths
      if (url.pathname === "/") {
        return new Response("✅ API worker is running", { status: 200 });
      }

      return new Response("Endpoint not found.", { status: 404 });

    } catch (e) {
      // General error handler
      console.error("Unhandled error:", e);
      return new Response("An internal server error occurred.", { status: 500 });
    }
  }
};

// --- Handlers ---

async function handleSaveScore(request, env) {
  if (request.method !== 'POST') {
    return new Response('Expected POST', { status: 405 });
  }
  const { userId, score, profileFrame, profileImage } = await request.json();

  if (!userId || typeof score === 'undefined') {
    return new Response("Missing required fields: userId and score.", { status: 400 });
  }

  const existing = await env.DB.prepare(
    "SELECT score FROM leaderboard WHERE user_id = ?"
  ).bind(userId).first();

  if (existing) {
    if (score > existing.score) {
      const { success } = await env.DB.prepare(
        "UPDATE leaderboard SET score = ?, profile_frame = ?, profile_image = ?, created_at = ? WHERE user_id = ?"
      ).bind(score, profileFrame || null, profileImage || null, new Date().toISOString(), userId).run();
      if (!success) {
        throw new Error("Database error: Failed to update score.");
      }
    }
  } else {
    const { success } = await env.DB.prepare(
      "INSERT INTO leaderboard (user_id, score, profile_frame, profile_image, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(userId, score, profileFrame || null, profileImage || null, new Date().toISOString()).run();
    if (!success) {
      throw new Error("Database error: Failed to insert new score.");
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function handleGetLeaderboard(request, env) {
  const { results } = await env.DB.prepare(
    "SELECT user_id as userId, username, MAX(score) as score, profile_frame as profileFrame, profile_image as profileImage FROM leaderboard GROUP BY user_id ORDER BY score DESC LIMIT 50"
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function handleReward(request, env) {
  // Placeholder for reward logic
  return new Response(JSON.stringify({ success: true, message: "Reward processed." }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function handleGetBalance(request, env) {
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return new Response("Missing userId parameter.", { status: 400, headers: corsHeaders });
  }

  const user = await env.DB.prepare(
    "SELECT score FROM leaderboard WHERE user_id = ? ORDER BY score DESC LIMIT 1"
  ).bind(userId).first();

  const balance = user ? user.score : 0;

  return new Response(JSON.stringify({ userId, balance }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}


async function handlePurchaseFrame(request, env) {
  if (request.method !== 'POST') {
    return new Response('Expected POST', { status: 405, headers: corsHeaders });
  }
  const { userId, frame } = await request.json();

  if (!userId || !frame) {
    return new Response("Missing required fields: userId and frame.", { status: 400, headers: corsHeaders });
  }

  // Check user's balance
  const user = await env.DB.prepare(
    "SELECT score FROM leaderboard WHERE user_id = ? ORDER BY score DESC LIMIT 1"
  ).bind(userId).first();

  const balance = user ? user.score : 0;
  const frameCost = 25;

  if (balance < frameCost) {
    return new Response(JSON.stringify({ success: false, message: "Insufficient balance." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Deduct cost and update frame
  const newBalance = balance - frameCost;
  const { success } = await env.DB.prepare(
    "UPDATE leaderboard SET score = ?, profile_frame = ? WHERE user_id = ?"
  ).bind(newBalance, frame, userId).run();

  if (!success) {
    throw new Error("Database error: Failed to update purchase.");
  }

  return new Response(JSON.stringify({ success: true, newBalance }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

// --- CORS ---

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
};

function handleOptions(request) {
  return new Response(null, {
    headers: corsHeaders,
  });
}