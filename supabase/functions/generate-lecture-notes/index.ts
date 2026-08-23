import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type StructuredNote = { heading: string; points: string[] };
type LectureNotes = {
  summary: string;
  structured_notes: StructuredNote[];
  important_points: string[];
  teacher_highlights: string[];
  key_concepts: string[];
};

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
]);

const corsHeaders = (origin: string | null): HeadersInit => ({
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  ...(origin && allowedOrigins.has(origin)
    ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
    : {}),
});

const jsonResponse = (body: Record<string, unknown>, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const parseNotes = (value: unknown): LectureNotes | null => {
  if (!isRecord(value) || typeof value.summary !== "string") return null;
  if (!Array.isArray(value.structured_notes) || !isStringArray(value.important_points)) return null;
  if (!isStringArray(value.teacher_highlights) || !isStringArray(value.key_concepts)) return null;

  const structuredNotes = value.structured_notes.map((note) => {
    if (!isRecord(note) || typeof note.heading !== "string" || !isStringArray(note.points)) return null;
    return { heading: note.heading, points: note.points };
  });

  return structuredNotes.every((note): note is StructuredNote => note !== null)
    ? {
        summary: value.summary,
        structured_notes: structuredNotes,
        important_points: value.important_points,
        teacher_highlights: value.teacher_highlights,
        key_concepts: value.key_concepts,
      }
    : null;
};

const getVerifiedGroqModel = async (apiKey: string): Promise<string> => {
  const response = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) throw new Error("Unable to verify available Groq models.");

  const payload = await response.json() as { data?: Array<{ id?: string }> };
  const modelIds = (payload.data ?? [])
    .map((model) => model.id)
    .filter((id): id is string => Boolean(id));
  const preferred = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  const model = preferred.find((id) => modelIds.includes(id)) ?? modelIds.find((id) => /llama|qwen/i.test(id));
  if (!model) throw new Error("No supported Groq text model is available.");
  return model;
};

const generateWithGroq = async (apiKey: string, transcript: string): Promise<LectureNotes> => {
  const model = await getVerifiedGroqModel(apiKey);
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Create lecture notes only from the supplied transcript. Do not invent facts or teacher highlights. Return only valid JSON with summary (string), structured_notes (array of objects with heading and points string array), important_points (string array), teacher_highlights (string array), and key_concepts (string array).",
        },
        { role: "user", content: `LECTURE TRANSCRIPT:\n${transcript}` },
      ],
    }),
  });
  if (!response.ok) throw new Error("Groq note generation failed.");

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned no lecture notes.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Groq returned invalid lecture-note JSON.");
  }

  const notes = parseNotes(parsed);
  if (!notes) throw new Error("Groq returned an invalid lecture-note structure.");
  return notes;
};

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, origin);

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !groqApiKey) {
    return jsonResponse({ error: "AI provider is not configured" }, 500, origin);
  }

  const token = authorization.slice("Bearer ".length);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return jsonResponse({ error: "Unauthorized" }, 401, origin);

  let sessionId: unknown;
  try {
    ({ session_id: sessionId } = await request.json());
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400, origin);
  }
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return jsonResponse({ error: "session_id is required" }, 400, origin);
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, faculty_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (sessionError) return jsonResponse({ error: "Failed to load session" }, 500, origin);
  if (!session) return jsonResponse({ error: "Session not found" }, 404, origin);
  if (session.faculty_id !== userData.user.id) {
    return jsonResponse({ error: "You are not allowed to generate notes for this session" }, 403, origin);
  }

  const { data: transcriptRows, error: transcriptError } = await supabase
    .from("transcript_entries")
    .select("text, timestamp, is_important")
    .eq("session_id", sessionId)
    .eq("is_final", true)
    .order("timestamp", { ascending: true });
  if (transcriptError) return jsonResponse({ error: "Failed to load transcript" }, 500, origin);
  if (!transcriptRows?.length) return jsonResponse({ error: "No transcript available for this session" }, 400, origin);

  const transcript = transcriptRows
    .map((row) => `${row.is_important ? "[IMPORTANT] " : ""}${row.text}`)
    .join("\n");

  try {
    const notes = await generateWithGroq(groqApiKey, transcript);
    const { data: savedNotes, error: notesError } = await supabase
      .from("notes")
      .upsert({ session_id: sessionId, ...notes }, { onConflict: "session_id" })
      .select()
      .single();
    if (notesError || !savedNotes) return jsonResponse({ error: "Failed to save lecture notes" }, 500, origin);
    return jsonResponse({ notes: savedNotes }, 200, origin);
  } catch (error) {
    console.error("Lecture note generation failed:", error instanceof Error ? error.message : "unknown error");
    return jsonResponse({ error: "Failed to generate lecture notes" }, 500, origin);
  }
});
