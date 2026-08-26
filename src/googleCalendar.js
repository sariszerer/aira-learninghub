// Google Calendar OAuth2 integration for AIRA Learning Hub

const CLIENT_ID = "343085916820-cm1s945ttcrhakoa3p30aeh9ht0ic9tc.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
const CALENDAR_ID = "airalearninghub@gmail.com";

let tokenClient = null;
let accessToken = null;

export function initGoogleAuth() {
  return new Promise((resolve) => {
    if (window.google) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

export async function signInToGoogle() {
  await initGoogleAuth();
  return new Promise((resolve, reject) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) { reject(response.error); return; }
        accessToken = response.access_token;
        localStorage.setItem("gcal_token", accessToken);
        resolve(accessToken);
      },
    });
    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

export function getStoredToken() {
  return localStorage.getItem("gcal_token");
}

export function clearToken() {
  localStorage.removeItem("gcal_token");
  accessToken = null;
}

export async function fetchCalendarEvents(date) {
  const token = accessToken || getStoredToken();
  if (!token) throw new Error("NOT_AUTHENTICATED");

  const start = `${date}T00:00:00-05:00`;
  const end = `${date}T23:59:59-05:00`;
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?timeMin=${encodeURIComponent(start)}&timeMax=${encodeURIComponent(end)}&singleEvents=true&orderBy=startTime&timeZone=America/Panama`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearToken();
    throw new Error("NOT_AUTHENTICATED");
  }

  const data = await res.json();
  const items = data.items || [];

  return items.map((ev) => {
    const start = ev.start?.dateTime || ev.start?.date || "";
    const end = ev.end?.dateTime || ev.end?.date || "";
    const fmtTime = (iso) => {
      if (!iso || !iso.includes("T")) return "";
      const d = new Date(iso);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Panama" });
    };
    return {
      id: ev.id,
      title: ev.summary || "Sin título",
      time: fmtTime(start),
      endTime: fmtTime(end),
      raw: ev.summary || "",
      description: ev.description || "",
      specialist: "",
    };
  });
}
