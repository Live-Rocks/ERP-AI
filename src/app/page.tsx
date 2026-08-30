"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin-demo");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) {
      setError("帳號或密碼不正確。請使用本機示範帳號登入。");
      return;
    }
    window.location.assign("/dashboard");
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <p className="eyebrow">ON-PREMISE AI ERP</p>
        <h1 id="login-title">智造工廠 ERP</h1>
        <p>請登入廠內系統。首版僅提供人員管理與權限基礎。</p>
        <form onSubmit={submit}>
          <label>帳號<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" /></label>
          <label>密碼<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit">登入系統</button>
        </form>
        <small>管理員：admin / admin-demo　技術員：tech / tech-demo</small>
      </section>
    </main>
  );
}
