let selectedPlace = null; // { name, place_id, lat, lng, types }
let overallRating = 0;
let staffCount = 0;

document.addEventListener("DOMContentLoaded", () => {
  initGooglePlaces();
  initStars(document.getElementById("overall-stars"), (v) => (overallRating = v));
  document.getElementById("add-staff-btn").addEventListener("click", addStaffRow);
  document.getElementById("report-form").addEventListener("submit", handleSubmit);
});

// Google Places Autocomplete — lets people type "surrey hospital" and match
// the real, canonical facility name/location instead of typing it by hand.
function initGooglePlaces() {
  const input = document.getElementById("facility-input");

  if (!CONFIG.GOOGLE_MAPS_API_KEY || CONFIG.GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY") {
    input.placeholder = "Type a facility name (Google Places not yet connected — see README)";
    return;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&libraries=places&callback=setupAutocomplete`;
  script.async = true;
  document.head.appendChild(script);
}

window.setupAutocomplete = function () {
  const input = document.getElementById("facility-input");
  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: ["health"],
    componentRestrictions: { country: "ca" },
    fields: ["place_id", "name", "geometry", "formatted_address", "types"],
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) return;
    selectedPlace = {
      place_id: place.place_id,
      name: place.name,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      address: place.formatted_address,
    };
  });
};

function initStars(container, onChange) {
  const icons = container.querySelectorAll("i");
  icons.forEach((icon, idx) => {
    icon.addEventListener("click", () => {
      const val = idx + 1;
      icons.forEach((ic, i) => ic.classList.toggle("filled", i < val));
      onChange(val);
    });
  });
}

function addStaffRow() {
  staffCount++;
  const wrap = document.getElementById("staff-rows");
  const row = document.createElement("div");
  row.className = "staff-row";
  row.dataset.staffId = staffCount;
  row.innerHTML = `
    <input type="text" placeholder="Doctor or nurse name" class="staff-name" />
    <div class="stars staff-stars">
      ${[1,2,3,4,5].map(() => '<i class="ti ti-star"></i>').join("")}
    </div>
    <button type="button" class="remove-staff" aria-label="Remove"><i class="ti ti-x"></i></button>
  `;
  wrap.appendChild(row);

  let rating = 0;
  initStars(row.querySelector(".stars"), (v) => (rating = v));
  row.dataset.rating = "0";
  row.querySelector(".stars").addEventListener("click", () => (row.dataset.rating = String(rating)));
  row.querySelector(".remove-staff").addEventListener("click", () => row.remove());
}

async function handleSubmit(e) {
  e.preventDefault();

  const checkin = document.getElementById("checkin-time").value;
  const seenBy = document.getElementById("seen-time").value;
  const ageBracket = document.getElementById("age-bracket").value;
  const category = document.getElementById("visit-category").value;

  const errorEl = document.getElementById("form-error");
  errorEl.classList.remove("show");

  if (!selectedPlace && !document.getElementById("facility-input").value.trim()) {
    return showError("Enter or select a hospital or clinic first.");
  }
  if (!checkin || !seenBy) {
    return showError("Fill in both check-in and seen-by-doctor times.");
  }
  if (!overallRating) {
    return showError("Give an overall star rating.");
  }
  if (new Date(`1970-01-01T${seenBy}`) < new Date(`1970-01-01T${checkin}`)) {
    // simple same-day sanity check; real app should use full datetimes
    return showError("Seen-by-doctor time should be after check-in time.");
  }

  const staffRows = Array.from(document.querySelectorAll(".staff-row"))
    .map((row) => ({
      name: row.querySelector(".staff-name").value.trim(),
      rating: Number(row.dataset.rating || 0),
    }))
    .filter((s) => s.name && s.rating);

  const payload = {
    facility_name: selectedPlace ? selectedPlace.name : document.getElementById("facility-input").value.trim(),
    facility_place_id: selectedPlace ? selectedPlace.place_id : null,
    facility_lat: selectedPlace ? selectedPlace.lat : null,
    facility_lng: selectedPlace ? selectedPlace.lng : null,
    checkin_time: checkin,
    seen_by_doctor_time: seenBy,
    age_bracket: ageBracket,
    visit_category: category,
    overall_rating: overallRating,
    staff: staffRows,
  };

  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting…";

  try {
    if (supabaseClient) {
      await submitToSupabase(payload);
    } else {
      console.log("Supabase not connected — demo submission:", payload);
      await new Promise((r) => setTimeout(r, 600));
    }
    document.getElementById("report-form").style.display = "none";
    document.getElementById("confirmation").style.display = "block";
  } catch (err) {
    console.error(err);
    showError("Something went wrong submitting your report. Please try again.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit report";
  }
}

async function submitToSupabase(payload) {
  // 1. Ensure the facility exists (upsert by google place_id if we have one)
  let facilityId;
  if (payload.facility_place_id) {
    const { data: existing } = await supabaseClient
      .from("facilities")
      .select("id")
      .eq("google_place_id", payload.facility_place_id)
      .maybeSingle();

    if (existing) {
      facilityId = existing.id;
    } else {
      const { data: created, error } = await supabaseClient
        .from("facilities")
        .insert({
          name: payload.facility_name,
          google_place_id: payload.facility_place_id,
          lat: payload.facility_lat,
          lng: payload.facility_lng,
        })
        .select("id")
        .single();
      if (error) throw error;
      facilityId = created.id;
    }
  } else {
    throw new Error("Please select a facility from the suggestions list.");
  }

  // 2. Insert the visit (fully anonymous — no user id, no name, no email)
  const { data: visit, error: visitError } = await supabaseClient
    .from("visits")
    .insert({
      facility_id: facilityId,
      checkin_time: payload.checkin_time,
      seen_by_doctor_time: payload.seen_by_doctor_time,
      age_bracket: payload.age_bracket,
      visit_category: payload.visit_category,
      overall_rating: payload.overall_rating,
    })
    .select("id")
    .single();
  if (visitError) throw visitError;

  // 3. Insert staff ratings, if any
  if (payload.staff.length) {
    const rows = payload.staff.map((s) => ({
      visit_id: visit.id,
      staff_name: s.name,
      rating: s.rating,
    }));
    const { error: staffError } = await supabaseClient.from("staff_ratings").insert(rows);
    if (staffError) throw staffError;
  }
}

function showError(msg) {
  const el = document.getElementById("form-error");
  el.textContent = msg;
  el.classList.add("show");
}
