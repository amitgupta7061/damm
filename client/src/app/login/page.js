"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect") || "/";
    const { login, user } = useAuth();
    
    const [step, setStep] = useState(1); // 1 = Email, 2 = Info (if new), 3 = OTP
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form State
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [profession, setProfession] = useState("");
    const [usagePurpose, setUsagePurpose] = useState("");
    const [companyOrSchool, setCompanyOrSchool] = useState("");
    const [otp, setOtp] = useState("");

    // Protect Route
    useEffect(() => {
        if (user) {
            router.push(redirectUrl);
        }
    }, [user, router, redirectUrl]);

    // Handle initial email submission
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !email.includes('@')) {
            setError("Please enter a valid email address.");
            return;
        }

        // Technically we should check if they exist here. But for MVP, 
        // we'll just force everyone through Step 2 info. If they already exist, 
        // the backend ignores the name payload anyway on upsert. Let's send them to Step 2.
        setError("");
        setStep(2);
    };

    // Handle info submission -> triggers OTP dispatch
    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !profession.trim() || !usagePurpose.trim()) {
            setError("Please fill out all required fields.");
            return;
        }
        
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${SERVER_URL}/api/auth/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name, profession, usagePurpose, companyOrSchool })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || "Failed to send OTP");
            
            setStep(3); // Move to OTP
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP Verification
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError("OTP must be 6 digits.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${SERVER_URL}/api/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || "Invalid OTP");
            
            // Login locally
            login(data.token, data.user);
            // Router redirect runs via useEffect
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="landing-page">
            <div className="landing-bg"><div className="grid-pattern" /></div>
            <div className="landing-content" style={{ maxWidth: 450 }}>
                
                <div className="landing-logo">
                    <span className="landing-logo-icon">✦</span>
                    <span className="landing-logo-text">CollabDraw</span>
                </div>

                <div className="landing-card" style={{ textAlign: "left" }}>
                    
                    {error && (
                        <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, marginBottom: 16, fontSize: 13, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleEmailSubmit}>
                            <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>Welcome Back</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Enter your email to sign in or create an account.</p>
                            
                            <div className="input-group">
                                <label>Email Address</label>
                                <input
                                    className="input-field"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <button className="btn-primary" type="submit">Continue →</button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleInfoSubmit}>
                            <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>Tell us about yourself</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>We use this to personalize your drawing experience. If you already have an account, just hit continue.</p>
                            
                            <div className="input-group">
                                <label>Full Name *</label>
                                <input className="input-field" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>

                            <div className="input-group">
                                <label>Profession *</label>
                                <select className="input-field" style={{ appearance: 'none' }} value={profession} onChange={e => setProfession(e.target.value)}>
                                    <option value="" disabled>Select profession</option>
                                    <option value="Developer">Developer / Engineer</option>
                                    <option value="Designer">UI / UX Designer</option>
                                    <option value="Manager">Product Manager</option>
                                    <option value="Educator">Educator / Teacher</option>
                                    <option value="Student">Student</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label>How will you use CollabDraw? *</label>
                                <select className="input-field" style={{ appearance: 'none' }} value={usagePurpose} onChange={e => setUsagePurpose(e.target.value)}>
                                    <option value="" disabled>Select usage</option>
                                    <option value="Individual">Personal Projects</option>
                                    <option value="Team">Team Collaboration</option>
                                    <option value="Education">Classroom / Education</option>
                                    <option value="Enterprise">Enterprise</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Company or School Name</label>
                                <input className="input-field" type="text" placeholder="Optional" value={companyOrSchool} onChange={(e) => setCompanyOrSchool(e.target.value)} />
                            </div>

                            <button className="btn-primary" type="submit" disabled={loading}>
                                {loading ? "Sending Code..." : "Send Verification Code"}
                            </button>
                            <button type="button" className="btn-secondary" style={{ width: '100%', marginTop: 12 }} onClick={() => setStep(1)}>Back</button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleVerifyOtp}>
                            <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>Check your email</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>We sent a 6-digit code to <strong>{email}</strong>.</p>
                            
                            <div className="input-group">
                                <label>Verification Code</label>
                                <input
                                    className="input-field"
                                    type="text"
                                    placeholder="123456"
                                    maxLength={6}
                                    style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: 'bold' }}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <button className="btn-primary" type="submit" disabled={loading}>
                                {loading ? "Verifying..." : "Verify & Log In"}
                            </button>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="landing-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Loading authentication portal...</div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
