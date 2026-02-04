import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { Zap, Lock, Mail, AlertCircle, User } from "lucide-react";

export function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, register } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (isRegister && password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    let success: boolean;
    if (isRegister) {
      success = await register(email, password, name || undefined);
      if (!success) {
        setError("Registration failed. Email may already exist.");
      }
    } else {
      success = await login(email, password);
      if (!success) {
        setError("Invalid credentials. Please try again.");
      }
    }

    setIsLoading(false);
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError("");

    // Try to login with demo credentials first (user may already exist)
    let success = await login("demo@example.com", "password123");

    if (!success) {
      // If login fails, try to register then login
      try {
        success = await register(
          "demo@example.com",
          "password123",
          "Demo User"
        );
      } catch (e) {
        // Registration might fail if user exists, try login again
        success = await login("demo@example.com", "password123");
      }
    }

    if (!success) {
      setError("Demo login failed. Please try registering a new account.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <Card className="w-full max-w-md relative bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl shadow-blue-500/5">
        {/* Glow border effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-sm -z-10" />

        <CardHeader className="space-y-4 pb-2">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-40 -z-10" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {isRegister ? "Create Account" : "Command Center"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isRegister
                ? "Sign up to start publishing"
                : "Social Media Publishing Hub"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="Your name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="password"
                  placeholder={
                    isRegister ? "Password (min 8 characters)" : "Password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium shadow-lg shadow-blue-500/25 border-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isRegister ? "Creating account..." : "Signing in..."}
                </span>
              ) : isRegister ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            <Zap className="w-4 h-4 mr-2 text-cyan-400" />
            Use Demo Account
          </Button>

          <Button
            variant="ghost"
            className="w-full text-slate-400 hover:text-white"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
