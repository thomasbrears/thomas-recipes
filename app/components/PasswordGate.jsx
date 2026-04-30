"use client";

import { useState } from "react";
import { App, Button, Input, Form, Typography } from "antd";
import { LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "recipes123";

export default function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#faf8f4" }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: "44px 48px", width: 380, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #ede8df", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f5ede0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <LockOutlined style={{ fontSize: 24, color: "#d4863a" }} />
        </div>
        <Title level={3} style={{ fontFamily: "'Georgia', serif", color: "#2a2420", marginBottom: 6 }}>
          Admin Area
        </Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 28, fontSize: 14 }}>
          Enter the password to add or edit recipes.
        </Text>
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item validateStatus={error ? "error" : ""} help={error ? "Incorrect password" : ""} style={{ marginBottom: 16 }}>
            <Input.Password
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="Password"
              size="large"
              autoFocus
              style={{ borderRadius: 10 }}
              onPressEnter={handleSubmit}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block
            style={{ borderRadius: 10, background: "#d4863a", borderColor: "#d4863a", fontWeight: 600, height: 44 }}>
            Unlock
          </Button>
        </Form>
      </div>
    </div>
  );
}