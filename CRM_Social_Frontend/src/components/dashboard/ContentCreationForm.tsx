import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useApp } from "@/context/AppContext";
import {
  PlatformIcon,
  getPlatformName,
  platformColors,
} from "@/components/shared/PlatformIcon";
import {
  ImagePlus,
  X,
  Send,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type {
  Platform,
  PublishingStatus,
  ConnectedAccount,
} from "@/types/social";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { PostTemplates } from "@/components/dashboard/PostTemplates";

const MAX_CHARS = 2200; // Instagram max, Facebook allows more

export function ContentCreationForm() {
  const { connectedAccounts } = useApp();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [publishingStatuses, setPublishingStatuses] = useState<
    (PublishingStatus & { accountName?: string })[]
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const connectedPlatforms = connectedAccounts.filter((a) => a.isConnected);
  const selectedAccounts = connectedAccounts.filter((a) =>
    selectedAccountIds.includes(a.id)
  );
  const selectedPlatforms = [
    ...new Set(selectedAccounts.map((a) => a.platform)),
  ];

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canPublish =
    content.trim() &&
    selectedAccountIds.length > 0 &&
    !isOverLimit &&
    !isPublishing;

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview immediately
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
      setImageFile(file);
    }
  };

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
      setImageFile(file);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setShowResults(true);
    setError(null);

    // Initialize publishing statuses with account names
    const initialStatuses = selectedAccounts.map((account) => ({
      platform: account.platform,
      accountName: account.accountName,
      status: "pending" as const,
    }));
    setPublishingStatuses(initialStatuses);

    try {
      // Upload image first if we have one
      let uploadedImageUrl = imageUrl;

      if (imageFile) {
        setPublishingStatuses((prev) =>
          prev.map((s) => ({ ...s, status: "publishing" as const }))
        );

        try {
          setIsUploading(true);
          const uploadResult = await api.uploadImage(imageFile);
          uploadedImageUrl = uploadResult.url;
          setIsUploading(false);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          // Continue without image if upload fails
          uploadedImageUrl = null;
        }
      }

      // Call the real API to create post with specific account IDs
      const response = await api.createPost(
        content,
        selectedPlatforms,
        uploadedImageUrl || undefined,
        selectedAccountIds
      );

      // Update statuses based on API response
      const finalStatuses: (PublishingStatus & { accountName?: string })[] =
        response.results.map((result: any) => ({
          platform: result.platform as Platform,
          accountName: result.accountName,
          status: (result.success ? "success" : "failed") as
            | "success"
            | "failed",
          postUrl: result.postUrl,
          error: result.error,
        }));

      setPublishingStatuses(finalStatuses);
    } catch (err: any) {
      console.error("Publish error:", err);
      setError(err.message || "Failed to publish post");

      // Mark all as failed
      setPublishingStatuses((prev) =>
        prev.map((s) => ({
          ...s,
          status: "failed" as const,
          error: err.message || "Failed to publish",
        }))
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReset = () => {
    setContent("");
    setImageUrl(null);
    setImageFile(null);
    setSelectedAccountIds([]);
    setPublishingStatuses([]);
    setShowResults(false);
    setError(null);
  };

  const getStatusIcon = (status: PublishingStatus["status"]) => {
    switch (status) {
      case "pending":
        return <div className="w-4 h-4 rounded-full bg-slate-600" />;
      case "publishing":
        return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
      case "success":
        return <Check className="w-4 h-4 text-green-400" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  if (showResults) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Publishing Status
          </h1>
          <p className="text-slate-400">
            {isPublishing
              ? "Publishing your content to selected accounts..."
              : "Publishing complete!"}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 max-w-2xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm max-w-2xl">
          <CardContent className="p-6 space-y-4">
            {publishingStatuses.map((status, index) => (
              <div
                key={`${status.platform}-${status.accountName}-${index}`}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-all duration-300",
                  status.status === "success" &&
                    "bg-green-500/5 border-green-500/30",
                  status.status === "failed" &&
                    "bg-red-500/5 border-red-500/30",
                  status.status === "publishing" &&
                    "bg-cyan-500/5 border-cyan-500/30",
                  status.status === "pending" &&
                    "bg-slate-800/30 border-slate-700/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800/50">
                    <PlatformIcon platform={status.platform} size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {status.accountName || getPlatformName(status.platform)}
                    </p>
                    <p
                      className={cn(
                        "text-sm",
                        status.status === "success" && "text-green-400",
                        status.status === "failed" && "text-red-400",
                        status.status === "publishing" && "text-cyan-400",
                        status.status === "pending" && "text-slate-500"
                      )}
                    >
                      {status.status === "pending" && "Waiting..."}
                      {status.status === "publishing" &&
                        (isUploading ? "Uploading image..." : "Publishing...")}
                      {status.status === "success" && "Posted successfully"}
                      {status.status === "failed" &&
                        (status.error || "Failed to publish")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {status.status === "success" && status.postUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      onClick={() => window.open(status.postUrl, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  )}
                  {getStatusIcon(status.status)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {!isPublishing && (
          <Button
            onClick={handleReset}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium shadow-lg shadow-blue-500/25 border-0"
          >
            Create Another Post
          </Button>
        )}
      </div>
    );
  }

  // Group accounts by platform for better organization
  const accountsByPlatform = connectedPlatforms.reduce((acc, account) => {
    if (!acc[account.platform]) {
      acc[account.platform] = [];
    }
    acc[account.platform].push(account);
    return acc;
  }, {} as Record<Platform, ConnectedAccount[]>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Create New Post
        </h1>
        <p className="text-slate-400">
          Compose and publish content to multiple platforms simultaneously
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Text Area */}
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">Post Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What would you like to share?"
                  className="w-full h-40 bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <div
                  className={cn(
                    "absolute bottom-3 right-3 text-sm font-medium",
                    isOverLimit
                      ? "text-red-400"
                      : charCount > MAX_CHARS * 0.8
                      ? "text-yellow-400"
                      : "text-slate-500"
                  )}
                >
                  {charCount}/{MAX_CHARS}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                Image Attachment (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {imageUrl ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Upload preview"
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageUrl(null);
                      setImageFile(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleImageDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/30 transition-all duration-200"
                >
                  <ImagePlus className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 mb-1">
                    Drag and drop an image here
                  </p>
                  <p className="text-sm text-slate-500">or click to browse</p>
                  <p className="text-xs text-slate-600 mt-2">
                    Note: Instagram requires an image
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Account Selection + Templates */}
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                Select Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectedPlatforms.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">
                  No accounts connected. Connect accounts to start publishing.
                </p>
              ) : (
                Object.entries(accountsByPlatform).map(
                  ([platform, accounts]) => (
                    <div key={platform} className="space-y-2">
                      {/* Platform header */}
                      <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                        <PlatformIcon
                          platform={platform as Platform}
                          size={16}
                        />
                        {getPlatformName(platform as Platform)}
                        {accounts.length > 1 && (
                          <span className="text-slate-500">
                            ({accounts.length})
                          </span>
                        )}
                      </div>
                      {/* Account list */}
                      {accounts.map((account) => (
                        <label
                          key={account.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ml-2",
                            selectedAccountIds.includes(account.id)
                              ? "bg-slate-800/50 border-blue-500/50"
                              : "bg-slate-800/20 border-slate-700/50 hover:border-slate-600"
                          )}
                        >
                          <Checkbox
                            checked={selectedAccountIds.includes(account.id)}
                            onCheckedChange={() =>
                              handleAccountToggle(account.id)
                            }
                            className="border-slate-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                          />
                          {account.avatar && (
                            <img
                              src={account.avatar}
                              alt={account.accountName}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span className="text-white text-sm flex-1 truncate">
                            {account.accountName}
                          </span>
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: platformColors[account.platform],
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  )
                )
              )}
            </CardContent>
          </Card>

          {/* Post Templates */}
          <PostTemplates
            currentContent={content}
            onUseTemplate={(templateContent) => setContent(templateContent)}
          />

          {/* Publish Button */}
          <Button
            onClick={handlePublish}
            disabled={!canPublish}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium shadow-lg shadow-blue-500/25 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 mr-2" />
            Publish to {selectedAccountIds.length} Account
            {selectedAccountIds.length !== 1 ? "s" : ""}
          </Button>

          {isOverLimit && (
            <p className="text-red-400 text-sm text-center">
              Content exceeds the character limit
            </p>
          )}

          {selectedAccounts.some((a) => a.platform === "instagram") &&
            !imageUrl && (
              <p className="text-yellow-400 text-sm text-center">
                ⚠️ Instagram posts require an image
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
