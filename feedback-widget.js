// A small, anonymous "report a bug / share feedback" bubble, shown on every
// page. Reuses the same privacy model as the rest of the site: no name,
// no email, nothing that identifies who sent it.

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    injectWidget();
    document.getElementById("feedback-bubble").addEventListener("click", togglePanel);
    document.getElementById("feedback-close").addEventListener("click", togglePanel);
    document.getElementById("feedback-form").addEventListener("submit", handleSubmit);
  });

  function injectWidget() {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <button id="feedback-bubble" aria-label="Report a bug or share feedback"><i class="ti ti-message-report"></i></button>
      <div id="feedback-panel">
        <div class="feedback-header">
          <div>
            <div class="title">Feedback &amp; bug reports</div>
            <div class="sub">Anonymous — helps us fix things faster</div>
          </div>
          <button id="feedback-close" aria-label="Close"><i class="ti ti-x"></i></button>
        </div>
        <form id="feedback-form">
          <div class="feedback-type-row">
            <label><input type="radio" name="fb-type" value="bug" checked> Bug</label>
            <label><input type="radio" name="fb-type" value="idea"> Idea</label>
            <label><input type="radio" name="fb-type" value="other"> Other</label>
          </div>
          <textarea id="feedback-message" rows="4" placeholder="What happened, or what would you like to see?" required></textarea>
          <button type="submit" class="btn primary block" style="height:38px;font-size:13.5px;">Send anonymously</button>
        </form>
        <div id="feedback-thanks" style="display:none;">
          <i class="ti ti-circle-check"></i>
          <p>Thanks — this really helps.</p>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
  }

  function togglePanel() {
    document.getElementById("feedback-panel").classList.toggle("open");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const type = document.querySelector('input[name="fb-type"]:checked').value;
    const message = document.getElementById("feedback-message").value.trim();
    if (!message) return;

    const submitBtn = e.target.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      if (typeof supabaseClient !== "undefined" && supabaseClient) {
        await supabaseClient.from("feedback").insert({
          type,
          message,
          page_url: window.location.href,
        });
      } else {
        console.log("Feedback (demo mode, not saved):", { type, message });
      }
      document.getElementById("feedback-form").style.display = "none";
      document.getElementById("feedback-thanks").style.display = "block";
    } catch (err) {
      console.error(err);
      submitBtn.disabled = false;
      submitBtn.textContent = "Send anonymously";
    }
  }
})();
