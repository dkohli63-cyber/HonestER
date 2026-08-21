document.addEventListener("DOMContentLoaded", async () => {
  if (!supabaseClient) {
    document.getElementById("login-view").innerHTML =
      "<p>Supabase isn't connected yet — set it up in config.js first (see README.md).</p>";
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) return showQueue();

  document.getElementById("login-btn").addEventListener("click", handleLogin);
});

async function handleLogin() {
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.classList.remove("show");

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    errorEl.textContent = "Sign-in failed. Check your email and password.";
    errorEl.classList.add("show");
    return;
  }
  showQueue();
}

async function showQueue() {
  document.getElementById("login-view").style.display = "none";
  document.getElementById("queue-view").style.display = "block";
  document.getElementById("admin-status").textContent = "Signed in as admin";
  loadPending();
}

async function loadPending() {
  const list = document.getElementById("mod-list");
  list.innerHTML = "<p>Loading…</p>";

  const { data, error } = await supabaseClient
    .from("staff_ratings")
    .select("id, staff_name, rating, created_at")
    .eq("approved", false)
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = `<p style="color:#B8492E;">Couldn't load queue: ${error.message}</p>`;
    return;
  }

  if (!data.length) {
    list.innerHTML = "<p style='color:var(--text-muted);'>Nothing pending. Fully caught up.</p>";
    return;
  }

  list.innerHTML = data
    .map(
      (r) => `<div class="mod-item" data-id="${r.id}">
        <div>
          <strong>${escapeHtml(r.staff_name)}</strong> — ${r.rating} ★
          <div style="font-size:11px;color:var(--text-muted);">${new Date(r.created_at).toLocaleString()}</div>
        </div>
        <div class="mod-actions">
          <button class="mod-approve" onclick="approveRating('${r.id}')">Approve</button>
          <button class="mod-reject" onclick="rejectRating('${r.id}')">Reject</button>
        </div>
      </div>`
    )
    .join("");
}

async function approveRating(id) {
  await supabaseClient.from("staff_ratings").update({ approved: true }).eq("id", id);
  loadPending();
}

async function rejectRating(id) {
  await supabaseClient.from("staff_ratings").delete().eq("id", id);
  loadPending();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
