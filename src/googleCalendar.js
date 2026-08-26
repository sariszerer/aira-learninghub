// Google Calendar - reads airalearninghub@gmail.com calendar
// Uses OAuth2 token flow (implicit grant)

const CLIENT_ID = "343085916820-cm1s945ttcrhakoa3p30aeh9ht0ic9tc.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
const CALENDAR_ID = "airalearninghub@gmail.com";

let tokenClient = null;
let _accessToken = null;

function getToken() {
  return _accessToken || sessionStorage.getItem("gcal_token");
}

function saveToken(token) {
  _accessToken = token;
  sessionStorage.setItem("gcal_token", token);
}

function clearToken() {
  _accessToken = null;
  sessionStorage.removeItem("gcal_token");
}

export function getStoredToken() {
  return getToken();
}

async function loadGoogleScript() {
  if (window.google?.accounts?.oauth2) return;
  await new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="accounts.google.com/gsi"]')) {
      // Script already loading, wait for it
      const check = setInterval(() => {
        if (window.google?.accounts?.oauth2) { clearInterval(check); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); resolve(); }, 5000);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => {
      const check = setInterval(() => {
        if (window.google?.accounts?.oauth2) { clearInterval(check); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); resolve(); }, 5000);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function signInToGoogle() {
  await loadGoogleScript();
  return new Promise((resolve, reject) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) { reject(new Error(response.error)); return; }
        saveToken(response.access_token);
        resolve(response.access_token);
      },
    });
    tokenClient.requestAccessToken({ prompt: "" }); // no prompt if already authorized
  });
}

export async function fetchCalendarEvents(date) {
  // Try to use existing token first
  let token = getToken();
  
  // If no token, try silent sign-in
  if (!token) {
    try {
      token = await signInToGoogle();
    } catch(e) {
      throw new Error("NOT_AUTHENTICATED");
    }
  }

  const start = `${date}T00:00:00-05:00`;
  const end = `${date}T23:59:59-05:00`;
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?timeMin=${encodeURIComponent(start)}&timeMax=${encodeURIComponent(end)}&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearToken();
    // Try once more with fresh token
    try {
      const newToken = await signInToGoogle();
      const res2 = await fetch(url, { headers: { Authorization: `Bearer ${newToken}` } });
      if (!res2.ok) throw new Error("NOT_AUTHENTICATED");
      const data2 = await res2.json();
      return parseEvents(data2.items || []);
    } catch(e) {
      throw new Error("NOT_AUTHENTICATED");
    }
  }

  if (!res.ok) throw new Error("Calendar error");
  
  const data = await res.json();
  return parseEvents(data.items || []);
}

function parseEvents(items) {
  return items.map((ev) => {
    const startDT = ev.start?.dateTime || ev.start?.date || "";
    const endDT = ev.end?.dateTime || ev.end?.date || "";
    const fmtTime = (iso) => {
      if (!iso || !iso.includes("T")) return "";
      return new Date(iso).toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Panama"
      });
    };
    // Detect cancelled events
    const desc = ev.description || "";
    const cancelled = desc.toUpperCase().includes("CANCEL") || 
                     (ev.status === "cancelled") ||
                     (ev.organizer?.responseStatus === "declined");
    return {
      id: ev.id,
      title: ev.summary || "Sin título",
      time: fmtTime(startDT),
      endTime: fmtTime(endDT),
      raw: ev.summary || "",
      description: desc,
      specialist: "",
      cancelled,
    };
  });
}
