document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activityOptionsLoaded = false;

  function renderParticipants(activityName, participants) {
    if (!participants.length) {
      return "<p class='empty-state'>No participants yet. Be the first to join.</p>";
    }

    return `
      <ul class="participants-list">
        ${participants
          .map(
            (participant) => `
              <li class="participant-item">
                <span class="participant-email">${participant}</span>
                <button
                  type="button"
                  class="participant-remove"
                  data-activity="${activityName}"
                  data-email="${participant}"
                  aria-label="Remove ${participant} from ${activityName}"
                  title="Remove participant"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M9 3.75A1.75 1.75 0 0 1 10.75 2h2.5A1.75 1.75 0 0 1 15 3.75V5h4a.75.75 0 0 1 0 1.5h-1.06l-.81 11.39A2.25 2.25 0 0 1 14.89 20H9.11a2.25 2.25 0 0 1-2.24-2.11L6.06 6.5H5a.75.75 0 0 1 0-1.5h4V3.75Zm1.5 0V5h2V3.75a.25.25 0 0 0-.25-.25h-1.5a.25.25 0 0 0-.25.25Zm-2.5 3.25.75 10.31c.03.4.36.69.76.69h5.58c.4 0 .73-.29.76-.69L16.5 7H8Z" />
                  </svg>
                </button>
              </li>
            `
          )
          .join("")}
      </ul>
    `;
  }

  async function removeParticipant(activityName, email) {
    const response = await fetch(
      `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "Could not remove participant");
    }

    messageDiv.textContent = result.message;
    messageDiv.className = "success";
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);

    await fetchActivities();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", {
        cache: "no-store",
      });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      if (!activityOptionsLoaded) {
        activitySelect.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-heading"><strong>Participants</strong></p>
            ${renderParticipants(name, details.participants)}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        if (!activityOptionsLoaded) {
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          activitySelect.appendChild(option);
        }
      });

      activityOptionsLoaded = true;
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove");

    if (!removeButton) {
      return;
    }

    const { activity, email } = removeButton.dataset;

    try {
      await removeParticipant(activity, email);
    } catch (error) {
      messageDiv.textContent = error.message || "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
      console.error("Error removing participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
