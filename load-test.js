import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

// Separate performance metrics
const loginDuration = new Trend("login_duration");
const projectsDuration = new Trend("projects_duration");

export const options = {
  vus: 5,
  duration: "30s",
};

export default function () {
  // Login once per virtual user
  const loginResponse = http.post(
    "http://host.docker.internal:4000/api/auth/login",
    JSON.stringify({
      email: __ENV.TASKFLOW_EMAIL,
      password: __ENV.TASKFLOW_PASSWORD,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
      tags: { endpoint: "login" },
    },
  );

  loginDuration.add(loginResponse.timings.duration);

  check(loginResponse, {
    "login successful": (r) => r.status === 200,
  });

  if (loginResponse.status !== 200) {
    return;
  }

  // Repeatedly fetch projects using the same session
  while (true) {
    const projectsResponse = http.get(
      "http://host.docker.internal:4000/api/projects",
      {
        tags: { endpoint: "projects" },
      },
    );

    projectsDuration.add(projectsResponse.timings.duration);

    check(projectsResponse, {
      "projects loaded": (r) => r.status === 200,
    });

    sleep(2);
  }
}
