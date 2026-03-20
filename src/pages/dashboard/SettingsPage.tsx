import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { useApiKeys, PROVIDER_LABELS, type ApiKeyProvider } from "@/hooks/useApiKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, User, Palette, Shield, Loader2, Save, LogOut, Camera, Key, Plus, Trash2, Smartphone, Lock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { motion } from "framer-motion";

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const { apiKeys, addKey, deleteKey } = useApiKeys();
  
  const [displayName, setDisplayName] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // API Key form state
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyProvider, setNewKeyProvider] = useState<ApiKeyProvider>("openai");
  const [newKeyValue, setNewKeyValue] = useState("");

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      
      // Check if user is OAuth-only by looking at identities
      const { data: identities } = await supabase.auth.getUserIdentities();
      const isOAuthOnly = !identities?.identities.some(id => id.provider === 'email');
      
      return { ...data, email: user.email, isOAuthOnly };
    },
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      const prof: any = profile;
      if (prof.phone_number) {
        const parts = prof.phone_number.split(" ");
        if (parts.length > 1 && parts[0].startsWith("+")) {
          setPhoneCountryCode(parts[0]);
          setPhoneNumber(parts.slice(1).join(" "));
        } else {
          setPhoneNumber(prof.phone_number);
        }
      }
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file");
    if (file.size > 2 * 1024 * 1024) return toast.error("Image must be under 2MB");

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Avatar updated");
    } catch (err: any) {
      toast.error(err.message);
    }
    setUploading(false);
  };

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ 
          display_name: displayName, 
          phone_number: phoneNumber ? `${phoneCountryCode} ${phoneNumber}` : null,
          theme_preference: theme 
        })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleChangePassword = async () => {
    if (!newPassword) return toast.error("Please enter a new password");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddApiKey = () => {
    if (!newKeyLabel.trim()) return toast.error("Label is required");
    if (!newKeyValue.trim()) return toast.error("API Key is required");
    
    addKey.mutate(
      { label: newKeyLabel, provider: newKeyProvider, api_key: newKeyValue },
      { onSuccess: () => {
        setNewKeyLabel("");
        setNewKeyValue("");
      }}
    );
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const initials = (displayName || profile?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-8 pb-12"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Settings className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground text-sm">Manage your account, preferences, and API keys</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* Profile Card */}
          <div className="clay-card p-6 border-0">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Profile</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Avatar" className="object-cover" />}
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm"
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div>
                  <p className="text-lg font-bold">{displayName || "No name set"}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="space-y-1.5 flex flex-col">
                  <Label htmlFor="displayName" className="text-muted-foreground ml-1">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="clay-inset h-12"
                  />
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <Label htmlFor="phone" className="font-medium ml-1 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" /> Mobile Number
                  </Label>
                  <div className="flex gap-2">
                    <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
                      <SelectTrigger className="w-[100px] clay-inset h-10 border-0">
                        <SelectValue placeholder="Code" />
                      </SelectTrigger>
                      <SelectContent className="clay-card border-0">
                        <SelectItem value="+1">US (+1)</SelectItem>
                        <SelectItem value="+44">UK (+44)</SelectItem>
                        <SelectItem value="+91">IN (+91)</SelectItem>
                        <SelectItem value="+61">AU (+61)</SelectItem>
                        <SelectItem value="+81">JP (+81)</SelectItem>
                        <SelectItem value="+49">DE (+49)</SelectItem>
                        <SelectItem value="+33">FR (+33)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="(555) 000-0000"
                      className="clay-inset h-10 border-0 focus-visible:ring-1 flex-1"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => updateProfile.mutate()}
                  disabled={updateProfile.isPending}
                  className="clay-btn w-full h-11 mt-2"
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5 mr-2" />
                  )}
                  Save Profile Info
                </Button>
              </div>
            </div>
          </div>

          {/* Appearance Card */}
          <div className="clay-card p-6 border-0">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-semibold">Appearance</h2>
            </div>
            <div className="flex items-center justify-between p-4 clay-inset rounded-[1rem]">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Toggle the app theme</p>
              </div>
              <ThemeToggle />
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* API Keys Card */}
          <div className="clay-card p-6 border-0">
            <div className="flex items-center gap-3 mb-6">
              <Key className="h-5 w-5 text-emerald-500" />
              <h2 className="text-xl font-semibold">API Keys</h2>
            </div>
            
            <div className="space-y-4">
              {/* Add Key Form */}
              <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-1.5"><Plus className="h-3.5 w-3.5"/> Add New Key</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    placeholder="Key Label (e.g. Work)" 
                    value={newKeyLabel} 
                    onChange={e => setNewKeyLabel(e.target.value)} 
                    className="clay-inset"
                  />
                  <Select value={newKeyProvider} onValueChange={(v) => setNewKeyProvider(v as ApiKeyProvider)}>
                    <SelectTrigger className="clay-inset">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="sk-..." 
                    type="password"
                    value={newKeyValue} 
                    onChange={e => setNewKeyValue(e.target.value)} 
                    className="clay-inset flex-1"
                  />
                  <Button 
                    onClick={handleAddApiKey} 
                    disabled={addKey.isPending}
                    className="clay-btn hover-float"
                  >
                    {addKey.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                </div>
              </div>

              {/* Saved Keys List */}
              <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                <p className="text-sm font-medium mb-3 text-muted-foreground">Saved Keys</p>
                {apiKeys?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-xl">No API keys saved yet.</p>
                ) : (
                  apiKeys?.map(key => (
                    <div key={key.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{key.label}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {PROVIDER_LABELS[key.provider]}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {key.api_key.substring(0, 4)}...{key.api_key.substring(key.api_key.length - 4)}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteKey.mutate(key.id)}
                        disabled={deleteKey.isPending}
                        className="text-destructive hover:bg-destructive/10 self-end sm:self-auto h-8 px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Account Security Card */}
          <div className="clay-card p-6 border-0">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-5 w-5 text-destructive" />
              <h2 className="text-xl font-semibold">Security</h2>
            </div>
            
            <div className="space-y-6">
              {profile?.isOAuthOnly ? (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-sm">
                  You signed in via Google. Password changes are managed by your provider.
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5"/> Change Password
                  </h3>
                  <div className="space-y-3">
                    <Input 
                      type="password" 
                      placeholder="New Password" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="clay-inset"
                    />
                    <Input 
                      type="password" 
                      placeholder="Confirm New Password" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="clay-inset"
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleChangePassword}
                      className="w-full"
                    >
                      Update Password
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-destructive">Sign Out</p>
                  <p className="text-xs text-muted-foreground">End your current session</p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleSignOut} className="rounded-xl px-4">
                  <LogOut className="h-4 w-4 mr-1.5" /> Sign Out
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
